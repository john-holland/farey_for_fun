#include <metal_stdlib>
using namespace metal;

// Prime-based wobble parameters
struct WobbleParams {
    float time;
    float2 eyePosition;
    float2 screenCenter;
    float primeFactor;
    float wobbleIntensity;
    float rotationSpeed;
    float primeFactors[8];  // Fixed-size array of 8 floats
    int primeMultiplicity[8];  // Fixed-size array of 8 ints
} __attribute__((aligned(16)));  // Ensure 16-byte alignment

// Vertex shader output structure
struct VertexOut {
    float4 position [[position]];
    float2 uv;
};

// Vertex shader
vertex VertexOut fareyVertexShader(
    uint vertexID [[vertex_id]],
    constant float4* vertices [[buffer(0)]],
    constant WobbleParams& params [[buffer(1)]]
) {
    VertexOut out;
    out.position = vertices[vertexID];
    
    // Calculate UV coordinates based on vertex position
    out.uv = float2(
        (vertices[vertexID].x + 1.0) * 0.5,
        (vertices[vertexID].y + 1.0) * 0.5
    );
    
    return out;
}

// Helper function to get prime-based color using HSL
float3 hsl2rgb(float3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    
    float c = (1.0 - abs(2.0 * l - 1.0)) * s;
    float x = c * (1.0 - abs(fmod(h * 6.0, 2.0) - 1.0));
    float m = l - c * 0.5;
    
    float3 rgb;
    if (h < 1.0/6.0) rgb = float3(c, x, 0.0);
    else if (h < 2.0/6.0) rgb = float3(x, c, 0.0);
    else if (h < 3.0/6.0) rgb = float3(0.0, c, x);
    else if (h < 4.0/6.0) rgb = float3(0.0, x, c);
    else if (h < 5.0/6.0) rgb = float3(x, 0.0, c);
    else rgb = float3(c, 0.0, x);
    
    return rgb + m;
}

// Prime-based wobble function with multiple factors
float2 applyPrimeWobble(float2 uv, constant WobbleParams& params) {
    float2 center = float2(0.5, 0.5);
    float2 dir = normalize(uv - center);
    float dist = length(uv - center);
    
    float totalWobble = 0.0;
    float totalRotation = 0.0;
    
    // Combine effects from all prime factors
    for (int i = 0; i < 8; i++) {
        if (params.primeFactors[i] <= 0.0) break;
        
        float prime = params.primeFactors[i];
        int multiplicity = params.primeMultiplicity[i];
        
        // Wobble effect
        float wobble = sin(params.time * prime) * 0.1 * multiplicity;
        totalWobble += wobble;
        
        // Rotation effect
        float rotation = params.time * prime * params.rotationSpeed * 0.5;
        totalRotation += rotation * multiplicity;
    }
    
    // Apply combined effects
    float angle = totalRotation + dist * params.primeFactor;
    float2 rotated = float2(
        dir.x * cos(angle) - dir.y * sin(angle),
        dir.x * sin(angle) + dir.y * cos(angle)
    );
    
    return center + rotated * dist * (1.0 + totalWobble * params.wobbleIntensity);
}

// Main fragment shader
fragment float4 fareyWobbleShader(
    VertexOut in [[stage_in]],
    constant WobbleParams& params [[buffer(0)]],
    texture2d<float> backgroundTexture [[texture(0)]]
) {
    constexpr sampler textureSampler(
        filter::linear,
        address::repeat
    );
    
    // Normalize screen coordinates
    float2 screenSize = float2(backgroundTexture.get_width(), backgroundTexture.get_height());
    float2 normalizedEyePos = params.eyePosition / screenSize;
    float2 normalizedCenter = params.screenCenter / screenSize;
    
    // Calculate parallax offset
    float2 eyeOffset = (normalizedEyePos - normalizedCenter) * 0.5;
    
    // Apply parallax effect with depth
    float depth = 0.5 + 0.5 * sin(params.time * 0.5);
    float2 parallaxOffset = eyeOffset * depth;
    
    // Add controlled time-based animation to UV coordinates
    float2 animatedUV = in.uv;
    float wobbleAmount = 0.05 * params.wobbleIntensity;  // Scale wobble by intensity
    animatedUV.x += sin(params.time * params.rotationSpeed) * wobbleAmount;
    animatedUV.y += cos(params.time * params.rotationSpeed) * wobbleAmount;
    
    // Apply prime-based wobble to the animated coordinates
    float2 wobbledUV = applyPrimeWobble(animatedUV + parallaxOffset, params);
    
    // Sample background texture with wobbled coordinates
    float4 wobbledColor = backgroundTexture.sample(textureSampler, wobbledUV);
    
    // Calculate prime-based color
    float3 primeColor = float3(0.0);
    float totalIntensity = 0.0;
    
    for (int i = 0; i < 8; i++) {
        if (params.primeFactors[i] <= 0.0) break;
        
        float prime = params.primeFactors[i];
        int multiplicity = params.primeMultiplicity[i];
        
        // Generate HSL color based on prime
        float hue = fmod(prime * 30.0, 360.0) / 360.0;
        float saturation = 0.8;
        float lightness = 0.5 + 0.2 * sin(params.time * prime * params.rotationSpeed);
        
        float3 hslColor = hsl2rgb(float3(hue, saturation, lightness));
        float intensity = sin(params.time * prime * params.rotationSpeed) * 0.5 + 0.5;
        
        primeColor += hslColor * intensity * multiplicity;
        totalIntensity += intensity * multiplicity;
    }
    
    // Normalize and combine colors
    if (totalIntensity > 0.0) {
        primeColor /= totalIntensity;
    }
    
    // Add subtle color shift based on eye position
    float3 eyeColorShift = float3(
        sin(normalizedEyePos.x * 2.0 * M_PI_F) * 0.1,
        sin(normalizedEyePos.y * 2.0 * M_PI_F) * 0.1,
        sin((normalizedEyePos.x + normalizedEyePos.y) * M_PI_F) * 0.1
    );
    
    // Mix background color with prime-based color
    float3 finalColor = mix(wobbledColor.rgb, primeColor + eyeColorShift, params.wobbleIntensity);
    
    // Add a subtle glow effect
    float glow = 0.2 * sin(params.time * params.rotationSpeed) + 0.3;
    finalColor += primeColor * glow * params.wobbleIntensity;
    
    // Ensure alpha is always 1.0
    return float4(finalColor, 1.0);
} 