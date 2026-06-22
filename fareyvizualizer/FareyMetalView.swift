#if os(iOS)
import UIKit
#else
import AppKit
#endif
import MetalKit
import SwiftUI

struct WobbleParams {
    var time: Float = 0
    var eyePosition: SIMD2<Float> = SIMD2<Float>(0, 0)
    var screenCenter: SIMD2<Float> = SIMD2<Float>(0, 0)
    var primeFactor: Float = 2.0
    var wobbleIntensity: Float = 0.5
    var rotationSpeed: Float = 1.0
    var primeFactors: (Float, Float, Float, Float, Float, Float, Float, Float) = (2.0, 0, 0, 0, 0, 0, 0, 0)
    var primeMultiplicity: (Int32, Int32, Int32, Int32, Int32, Int32, Int32, Int32) = (1, 0, 0, 0, 0, 0, 0, 0)
    
    init() {
        // Initialize with default values
        self.time = 0
        self.eyePosition = SIMD2<Float>(0, 0)
        self.screenCenter = SIMD2<Float>(0, 0)
        self.primeFactor = 2.0
        self.wobbleIntensity = 0.5
        self.rotationSpeed = 1.0
        self.primeFactors = (2.0, 0, 0, 0, 0, 0, 0, 0)
        self.primeMultiplicity = (1, 0, 0, 0, 0, 0, 0, 0)
    }
    
    mutating func updatePrimeFactors(_ factors: [Float], _ multiplicity: [Int]) {
        var newFactors: (Float, Float, Float, Float, Float, Float, Float, Float) = (0, 0, 0, 0, 0, 0, 0, 0)
        var newMultiplicity: (Int32, Int32, Int32, Int32, Int32, Int32, Int32, Int32) = (0, 0, 0, 0, 0, 0, 0, 0)
        
        for i in 0..<min(8, factors.count) {
            switch i {
            case 0: newFactors.0 = factors[i]; newMultiplicity.0 = Int32(multiplicity[i])
            case 1: newFactors.1 = factors[i]; newMultiplicity.1 = Int32(multiplicity[i])
            case 2: newFactors.2 = factors[i]; newMultiplicity.2 = Int32(multiplicity[i])
            case 3: newFactors.3 = factors[i]; newMultiplicity.3 = Int32(multiplicity[i])
            case 4: newFactors.4 = factors[i]; newMultiplicity.4 = Int32(multiplicity[i])
            case 5: newFactors.5 = factors[i]; newMultiplicity.5 = Int32(multiplicity[i])
            case 6: newFactors.6 = factors[i]; newMultiplicity.6 = Int32(multiplicity[i])
            case 7: newFactors.7 = factors[i]; newMultiplicity.7 = Int32(multiplicity[i])
            default: break
            }
        }
        
        self.primeFactors = newFactors
        self.primeMultiplicity = newMultiplicity
    }
}

class FareyMetalView: MTKView {
    private var commandQueue: MTLCommandQueue!
    private var renderPipeline: MTLRenderPipelineState!
    private var computePipeline: MTLComputePipelineState!
    private var vertexBuffer: MTLBuffer!
    private var wobbleParams: WobbleParams!
    private var lastUpdateTime: CFTimeInterval = 0
    private var isAnimating: Bool = true
    private var backgroundTexture: MTLTexture?
    
    // Eye tracking simulation (replace with actual eye tracking)
    private var eyePosition: CGPoint = .zero
    
    // Prime number utilities
    private func isPrime(_ n: Int) -> Bool {
        guard n > 1 else { return false }
        guard n != 2 else { return true }
        guard n % 2 != 0 else { return false }
        
        let sqrtN = Int(sqrt(Double(n)))
        for i in stride(from: 3, through: sqrtN, by: 2) {
            if n % i == 0 { return false }
        }
        return true
    }
    
    private func factorize(_ n: Int) -> (factors: [Int], multiplicity: [Int]) {
        var n = n
        var factors: [Int] = []
        var multiplicity: [Int] = []
        
        // Handle 2 separately
        if n % 2 == 0 {
            var count = 0
            while n % 2 == 0 {
                n /= 2
                count += 1
            }
            factors.append(2)
            multiplicity.append(count)
        }
        
        // Check odd numbers up to sqrt(n)
        let sqrtN = Int(sqrt(Double(n)))
        for i in stride(from: 3, through: sqrtN, by: 2) {
            if n % i == 0 {
                var count = 0
                while n % i == 0 {
                    n /= i
                    count += 1
                }
                factors.append(i)
                multiplicity.append(count)
            }
        }
        
        // If n is still greater than 2, it's a prime
        if n > 2 {
            factors.append(n)
            multiplicity.append(1)
        }
        
        return (factors, multiplicity)
    }
    
    init(frame: CGRect) {
        super.init(frame: frame, device: MTLCreateSystemDefaultDevice())
        setupMetal()
        setupGestures()
    }
    
    required init(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    private func setupMetal() {
        guard let device = device else {
            print("Failed to get Metal device")
            return
        }
        
        print("Setting up Metal with device: \(device.name)")
        
        // Create command queue
        commandQueue = device.makeCommandQueue()
        
        // Load shaders
        guard let library = device.makeDefaultLibrary() else {
            print("Failed to create default library")
            return
        }
        
        guard let vertexFunction = library.makeFunction(name: "fareyVertexShader"),
              let fragmentFunction = library.makeFunction(name: "fareyWobbleShader") else {
            print("Failed to load shader functions")
            return
        }
        
        // Create render pipeline
        let pipelineDescriptor = MTLRenderPipelineDescriptor()
        pipelineDescriptor.vertexFunction = vertexFunction
        pipelineDescriptor.fragmentFunction = fragmentFunction
        pipelineDescriptor.colorAttachments[0].pixelFormat = colorPixelFormat
        pipelineDescriptor.colorAttachments[0].isBlendingEnabled = true
        pipelineDescriptor.colorAttachments[0].sourceRGBBlendFactor = .sourceAlpha
        pipelineDescriptor.colorAttachments[0].destinationRGBBlendFactor = .oneMinusSourceAlpha
        pipelineDescriptor.colorAttachments[0].alphaBlendOperation = .add
        
        do {
            renderPipeline = try device.makeRenderPipelineState(descriptor: pipelineDescriptor)
            print("Successfully created render pipeline")
        } catch {
            print("Failed to create pipeline state: \(error)")
            return
        }
        
        // Create vertex buffer
        let vertices: [Float] = [
            -1, -1, 0, 1,
             1, -1, 0, 1,
            -1,  1, 0, 1,
             1,  1, 0, 1
        ]
        vertexBuffer = device.makeBuffer(bytes: vertices, length: vertices.count * MemoryLayout<Float>.size, options: [])
        
        // Initialize wobble parameters
        wobbleParams = WobbleParams()
        wobbleParams.screenCenter = SIMD2<Float>(Float(bounds.width/2), Float(bounds.height/2))
        
        // Load background texture
        loadBackgroundTexture()
        
        // Set up display link
        preferredFramesPerSecond = 60
        isPaused = false
        enableSetNeedsDisplay = true
        
        print("Metal setup completed")
    }
    
    private func loadBackgroundTexture() {
        guard let device = device else {
            print("Failed to get Metal device for texture creation")
            return
        }
        
        // Create a checkerboard pattern texture
        let textureSize = 512
        let bytesPerPixel = 4
        let bytesPerRow = textureSize * bytesPerPixel
        let totalBytes = textureSize * textureSize * bytesPerPixel
        
        var textureData = [UInt8](repeating: 0, count: totalBytes)
        
        // Generate checkerboard pattern with larger squares and more contrast
        let squareSize = 128 // Larger squares
        for y in 0..<textureSize {
            for x in 0..<textureSize {
                let isEven = ((x / squareSize) + (y / squareSize)) % 2 == 0
                let index = (y * textureSize + x) * bytesPerPixel
                
                // RGBA values with more contrast
                textureData[index] = isEven ? 30 : 225     // R
                textureData[index + 1] = isEven ? 30 : 225 // G
                textureData[index + 2] = isEven ? 30 : 225 // B
                textureData[index + 3] = 255               // A
            }
        }
        
        // Create texture descriptor
        let textureDescriptor = MTLTextureDescriptor.texture2DDescriptor(
            pixelFormat: .rgba8Unorm,
            width: textureSize,
            height: textureSize,
            mipmapped: false
        )
        textureDescriptor.usage = [.shaderRead]
        textureDescriptor.storageMode = .shared
        
        // Create texture
        if let texture = device.makeTexture(descriptor: textureDescriptor) {
            texture.replace(
                region: MTLRegionMake2D(0, 0, textureSize, textureSize),
                mipmapLevel: 0,
                withBytes: textureData,
                bytesPerRow: bytesPerRow
            )
            backgroundTexture = texture
            print("Successfully created background texture: \(textureSize)x\(textureSize)")
        } else {
            print("Failed to create background texture")
        }
    }
    
    private func setupGestures() {
        #if os(iOS)
        let panGesture = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
        addGestureRecognizer(panGesture)
        #endif
    }
    
    #if os(iOS)
    @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
        let location = gesture.location(in: self)
        eyePosition = location
        
        // Update eye position with smooth interpolation
        let targetPosition = SIMD2<Float>(Float(location.x), Float(location.y))
        let currentPosition = wobbleParams.eyePosition
        wobbleParams.eyePosition = mix(currentPosition, targetPosition, t: 0.1)
        
        // Update prime factors if needed
        let prime = Int(wobbleParams.primeFactor)
        if isPrime(prime) {
            let (factors, multiplicity) = factorize(prime)
            wobbleParams.primeFactors = (Float(factors[0]), Float(factors[1]), Float(factors[2]), Float(factors[3]), Float(factors[4]), Float(factors[5]), Float(factors[6]), Float(factors[7]))
            wobbleParams.primeMultiplicity = (Int32(multiplicity[0]), Int32(multiplicity[1]), Int32(multiplicity[2]), Int32(multiplicity[3]), Int32(multiplicity[4]), Int32(multiplicity[5]), Int32(multiplicity[6]), Int32(multiplicity[7]))
        }
    }
    #endif
    
    private func mix(_ a: SIMD2<Float>, _ b: SIMD2<Float>, t: Float) -> SIMD2<Float> {
        return a + (b - a) * t
    }
    
    override func draw(_ rect: CGRect) {
        guard let drawable = currentDrawable,
              let commandBuffer = commandQueue.makeCommandBuffer(),
              let renderPassDescriptor = currentRenderPassDescriptor else {
            print("Failed to get drawable or command buffer")
            return
        }
        
        // Update time only if animating
        if isAnimating {
            let currentTime = CACurrentMediaTime()
            let deltaTime = Float(currentTime - lastUpdateTime)
            lastUpdateTime = currentTime
            wobbleParams.time += deltaTime
        }
        
        // Create render command encoder
        guard let renderEncoder = commandBuffer.makeRenderCommandEncoder(descriptor: renderPassDescriptor) else {
            print("Failed to create render encoder")
            return
        }
        
        renderEncoder.setRenderPipelineState(renderPipeline)
        
        // Set vertex buffer
        renderEncoder.setVertexBuffer(vertexBuffer, offset: 0, index: 0)
        
        // Create a properly aligned buffer for the parameters
        let paramsSize = MemoryLayout<WobbleParams>.size
        let alignedSize = (paramsSize + 15) & ~15  // Round up to nearest 16 bytes
        var alignedParams = wobbleParams
        
        // Set vertex parameters
        renderEncoder.setVertexBytes(&alignedParams, length: alignedSize, index: 1)
        
        // Set fragment parameters
        renderEncoder.setFragmentBytes(&alignedParams, length: alignedSize, index: 0)
        
        if let texture = backgroundTexture {
            renderEncoder.setFragmentTexture(texture, index: 0)
        } else {
            print("Background texture is nil")
        }
        
        // Draw quad
        renderEncoder.drawPrimitives(type: .triangleStrip, vertexStart: 0, vertexCount: 4)
        
        renderEncoder.endEncoding()
        commandBuffer.present(drawable)
        commandBuffer.commit()
    }
    
    func setAnimating(_ animating: Bool) {
        isAnimating = animating
        if animating {
            lastUpdateTime = CACurrentMediaTime()
        }
    }
}

// SwiftUI wrapper
struct FareyMetalViewRepresentable: View {
    var primeFactor: Float
    var wobbleIntensity: Float
    var rotationSpeed: Float
    var isAnimating: Bool
    var mousePosition: CGPoint
    
    var body: some View {
        MetalViewRepresentable(
            primeFactor: primeFactor,
            wobbleIntensity: wobbleIntensity,
            rotationSpeed: rotationSpeed,
            isAnimating: isAnimating,
            mousePosition: mousePosition
        )
    }
}

#if os(iOS)
struct MetalViewRepresentable: UIViewRepresentable {
    var primeFactor: Float
    var wobbleIntensity: Float
    var rotationSpeed: Float
    var isAnimating: Bool
    var mousePosition: CGPoint
    
    func makeUIView(context: UIViewRepresentableContext<MetalViewRepresentable>) -> MTKView {
        let mtkView = MTKView()
        mtkView.delegate = context.coordinator
        mtkView.device = MTLCreateSystemDefaultDevice()
        mtkView.framebufferOnly = false
        mtkView.clearColor = MTLClearColor(red: 0, green: 0, blue: 0, alpha: 1)
        mtkView.drawableSize = mtkView.frame.size
        mtkView.enableSetNeedsDisplay = true
        mtkView.isPaused = false
        mtkView.preferredFramesPerSecond = 60
        return mtkView
    }
    
    func updateUIView(_ uiView: MTKView, context: UIViewRepresentableContext<MetalViewRepresentable>) {
        context.coordinator.updateParameters(
            primeFactor: primeFactor,
            wobbleIntensity: wobbleIntensity,
            rotationSpeed: rotationSpeed,
            isAnimating: isAnimating,
            mousePosition: mousePosition
        )
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, MTKViewDelegate {
        var parent: MetalViewRepresentable
        var device: MTLDevice?
        var commandQueue: MTLCommandQueue?
        var pipelineState: MTLRenderPipelineState?
        var vertexBuffer: MTLBuffer?
        var wobbleParams: WobbleParams
        var backgroundTexture: MTLTexture?
        var lastUpdateTime: CFTimeInterval = 0
        
        init(_ parent: MetalViewRepresentable) {
            self.parent = parent
            self.wobbleParams = WobbleParams()
            super.init()
            setupMetal()
        }
        
        func updateParameters(primeFactor: Float, wobbleIntensity: Float, rotationSpeed: Float, isAnimating: Bool, mousePosition: CGPoint) {
            wobbleParams.primeFactor = primeFactor
            wobbleParams.wobbleIntensity = wobbleIntensity
            wobbleParams.rotationSpeed = rotationSpeed
            
            // Update eye position with smooth interpolation
            let targetPosition = SIMD2<Float>(Float(mousePosition.x), Float(mousePosition.y))
            let currentPosition = wobbleParams.eyePosition
            wobbleParams.eyePosition = mix(currentPosition, targetPosition, t: 0.1)
            
            // Update screen center
            if let view = device?.makeCommandQueue()?.device as? MTKView {
                wobbleParams.screenCenter = SIMD2<Float>(Float(view.bounds.width/2), Float(view.bounds.height/2))
            }
        }
        
        func setupMetal() {
            guard let device = MTLCreateSystemDefaultDevice() else {
                print("Failed to create Metal device")
                return
            }
            self.device = device
            self.commandQueue = device.makeCommandQueue()
            
            // Create pipeline state
            guard let library = device.makeDefaultLibrary() else {
                print("Failed to create default library")
                return
            }
            
            guard let vertexFunction = library.makeFunction(name: "fareyVertexShader"),
                  let fragmentFunction = library.makeFunction(name: "fareyWobbleShader") else {
                print("Failed to load shader functions")
                return
            }
            
            let pipelineDescriptor = MTLRenderPipelineDescriptor()
            pipelineDescriptor.vertexFunction = vertexFunction
            pipelineDescriptor.fragmentFunction = fragmentFunction
            pipelineDescriptor.colorAttachments[0].pixelFormat = .bgra8Unorm
            pipelineDescriptor.colorAttachments[0].isBlendingEnabled = true
            pipelineDescriptor.colorAttachments[0].sourceRGBBlendFactor = .sourceAlpha
            pipelineDescriptor.colorAttachments[0].destinationRGBBlendFactor = .oneMinusSourceAlpha
            
            do {
                pipelineState = try device.makeRenderPipelineState(descriptor: pipelineDescriptor)
                print("Successfully created pipeline state")
                
                // Create vertex buffer
                let vertices: [Float] = [
                    -1, -1, 0, 1,
                     1, -1, 0, 1,
                    -1,  1, 0, 1,
                     1,  1, 0, 1
                ]
                vertexBuffer = device.makeBuffer(bytes: vertices, length: vertices.count * MemoryLayout<Float>.size, options: [])
                print("Successfully created vertex buffer")
                
                // Create background texture
                loadBackgroundTexture()
                
            } catch {
                print("Failed to create pipeline state: \(error)")
            }
        }
        
        private func loadBackgroundTexture() {
            guard let device = device else { return }
            
            // Create a checkerboard pattern texture
            let textureSize = 512
            let bytesPerPixel = 4
            let bytesPerRow = textureSize * bytesPerPixel
            let totalBytes = textureSize * textureSize * bytesPerPixel
            
            var textureData = [UInt8](repeating: 0, count: totalBytes)
            
            // Generate checkerboard pattern with larger squares and more contrast
            let squareSize = 128 // Larger squares
            for y in 0..<textureSize {
                for x in 0..<textureSize {
                    let isEven = ((x / squareSize) + (y / squareSize)) % 2 == 0
                    let index = (y * textureSize + x) * bytesPerPixel
                    
                    // RGBA values with more contrast
                    textureData[index] = isEven ? 30 : 225     // R
                    textureData[index + 1] = isEven ? 30 : 225 // G
                    textureData[index + 2] = isEven ? 30 : 225 // B
                    textureData[index + 3] = 255               // A
                }
            }
            
            // Create texture descriptor
            let textureDescriptor = MTLTextureDescriptor.texture2DDescriptor(
                pixelFormat: .rgba8Unorm,
                width: textureSize,
                height: textureSize,
                mipmapped: false
            )
            textureDescriptor.usage = [.shaderRead]
            textureDescriptor.storageMode = .shared
            
            // Create texture
            if let texture = device.makeTexture(descriptor: textureDescriptor) {
                texture.replace(
                    region: MTLRegionMake2D(0, 0, textureSize, textureSize),
                    mipmapLevel: 0,
                    withBytes: textureData,
                    bytesPerRow: bytesPerRow
                )
                backgroundTexture = texture
                print("Successfully created background texture: \(textureSize)x\(textureSize)")
            }
        }
        
        func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
            // Update screen center when size changes
            wobbleParams.screenCenter = SIMD2<Float>(Float(size.width/2), Float(size.height/2))
        }
        
        func draw(in view: MTKView) {
            guard let drawable = view.currentDrawable,
                  let pipelineState = pipelineState,
                  let commandBuffer = commandQueue?.makeCommandBuffer(),
                  let renderPassDescriptor = view.currentRenderPassDescriptor,
                  let renderEncoder = commandBuffer.makeRenderCommandEncoder(descriptor: renderPassDescriptor) else {
                print("Failed to get required Metal objects for rendering")
                return
            }
            
            // Debug checks
            guard let vertexBuffer = vertexBuffer else {
                print("Vertex buffer is nil")
                return
            }
            
            // Update time with a fixed delta time for consistent animation
            let currentTime = CACurrentMediaTime()
            let deltaTime = Float(currentTime - lastUpdateTime)
            lastUpdateTime = currentTime
            wobbleParams.time += deltaTime * 2.0  // Speed up the animation
            
            print("Current time: \(wobbleParams.time)")  // Debug print
            
            // Set up render pipeline
            renderEncoder.setRenderPipelineState(pipelineState)
            
            // Set vertex buffer and parameters
            renderEncoder.setVertexBuffer(vertexBuffer, offset: 0, index: 0)
            
            // Create a properly aligned buffer for the parameters
            let paramsSize = MemoryLayout<WobbleParams>.size
            let alignedSize = (paramsSize + 15) & ~15  // Round up to nearest 16 bytes
            var alignedParams = wobbleParams
            
            // Set vertex parameters
            renderEncoder.setVertexBytes(&alignedParams, length: alignedSize, index: 1)
            
            // Set fragment parameters
            renderEncoder.setFragmentBytes(&alignedParams, length: alignedSize, index: 0)
            
            if let texture = backgroundTexture {
                renderEncoder.setFragmentTexture(texture, index: 0)
            } else {
                print("Background texture is nil")
            }
            
            // Draw quad
            renderEncoder.drawPrimitives(type: .triangleStrip, vertexStart: 0, vertexCount: 4)
            
            renderEncoder.endEncoding()
            commandBuffer.present(drawable)
            commandBuffer.commit()
        }
    }
}
#else
struct MetalViewRepresentable: NSViewRepresentable {
    var primeFactor: Float
    var wobbleIntensity: Float
    var rotationSpeed: Float
    var isAnimating: Bool
    var mousePosition: CGPoint
    
    func makeNSView(context: NSViewRepresentableContext<MetalViewRepresentable>) -> MTKView {
        let mtkView = MTKView()
        mtkView.delegate = context.coordinator
        mtkView.device = MTLCreateSystemDefaultDevice()
        mtkView.framebufferOnly = false
        mtkView.clearColor = MTLClearColor(red: 0, green: 0, blue: 0, alpha: 1)
        mtkView.drawableSize = mtkView.frame.size
        mtkView.enableSetNeedsDisplay = true
        mtkView.isPaused = false
        mtkView.preferredFramesPerSecond = 60
        return mtkView
    }
    
    func updateNSView(_ nsView: MTKView, context: NSViewRepresentableContext<MetalViewRepresentable>) {
        context.coordinator.updateParameters(
            primeFactor: primeFactor,
            wobbleIntensity: wobbleIntensity,
            rotationSpeed: rotationSpeed,
            isAnimating: isAnimating,
            mousePosition: mousePosition
        )
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, MTKViewDelegate {
        var parent: MetalViewRepresentable
        var device: MTLDevice?
        var commandQueue: MTLCommandQueue?
        var pipelineState: MTLRenderPipelineState?
        var vertexBuffer: MTLBuffer?
        var wobbleParams: WobbleParams
        var backgroundTexture: MTLTexture?
        var lastUpdateTime: CFTimeInterval = 0
        
        init(_ parent: MetalViewRepresentable) {
            self.parent = parent
            self.wobbleParams = WobbleParams()
            super.init()
            setupMetal()
        }
        
        func updateParameters(primeFactor: Float, wobbleIntensity: Float, rotationSpeed: Float, isAnimating: Bool, mousePosition: CGPoint) {
            wobbleParams.primeFactor = primeFactor
            wobbleParams.wobbleIntensity = wobbleIntensity
            wobbleParams.rotationSpeed = rotationSpeed
            
            // Update eye position with smooth interpolation
            let targetPosition = SIMD2<Float>(Float(mousePosition.x), Float(mousePosition.y))
            let currentPosition = wobbleParams.eyePosition
            wobbleParams.eyePosition = mix(currentPosition, targetPosition, t: 0.1)
            
            // Update screen center
            if let view = device?.makeCommandQueue()?.device as? MTKView {
                wobbleParams.screenCenter = SIMD2<Float>(Float(view.bounds.width/2), Float(view.bounds.height/2))
            }
        }
        
        func setupMetal() {
            guard let device = MTLCreateSystemDefaultDevice() else {
                print("Failed to create Metal device")
                return
            }
            self.device = device
            self.commandQueue = device.makeCommandQueue()
            
            // Create pipeline state
            guard let library = device.makeDefaultLibrary() else {
                print("Failed to create default library")
                return
            }
            
            guard let vertexFunction = library.makeFunction(name: "fareyVertexShader"),
                  let fragmentFunction = library.makeFunction(name: "fareyWobbleShader") else {
                print("Failed to load shader functions")
                return
            }
            
            let pipelineDescriptor = MTLRenderPipelineDescriptor()
            pipelineDescriptor.vertexFunction = vertexFunction
            pipelineDescriptor.fragmentFunction = fragmentFunction
            pipelineDescriptor.colorAttachments[0].pixelFormat = .bgra8Unorm
            pipelineDescriptor.colorAttachments[0].isBlendingEnabled = true
            pipelineDescriptor.colorAttachments[0].sourceRGBBlendFactor = .sourceAlpha
            pipelineDescriptor.colorAttachments[0].destinationRGBBlendFactor = .oneMinusSourceAlpha
            
            do {
                pipelineState = try device.makeRenderPipelineState(descriptor: pipelineDescriptor)
                print("Successfully created pipeline state")
                
                // Create vertex buffer
                let vertices: [Float] = [
                    -1, -1, 0, 1,
                     1, -1, 0, 1,
                    -1,  1, 0, 1,
                     1,  1, 0, 1
                ]
                vertexBuffer = device.makeBuffer(bytes: vertices, length: vertices.count * MemoryLayout<Float>.size, options: [])
                print("Successfully created vertex buffer")
                
                // Create background texture
                loadBackgroundTexture()
                
            } catch {
                print("Failed to create pipeline state: \(error)")
            }
        }
        
        private func loadBackgroundTexture() {
            guard let device = device else { return }
            
            // Create a checkerboard pattern texture
            let textureSize = 512
            let bytesPerPixel = 4
            let bytesPerRow = textureSize * bytesPerPixel
            let totalBytes = textureSize * textureSize * bytesPerPixel
            
            var textureData = [UInt8](repeating: 0, count: totalBytes)
            
            // Generate checkerboard pattern with larger squares and more contrast
            let squareSize = 128 // Larger squares
            for y in 0..<textureSize {
                for x in 0..<textureSize {
                    let isEven = ((x / squareSize) + (y / squareSize)) % 2 == 0
                    let index = (y * textureSize + x) * bytesPerPixel
                    
                    // RGBA values with more contrast
                    textureData[index] = isEven ? 30 : 225     // R
                    textureData[index + 1] = isEven ? 30 : 225 // G
                    textureData[index + 2] = isEven ? 30 : 225 // B
                    textureData[index + 3] = 255               // A
                }
            }
            
            // Create texture descriptor
            let textureDescriptor = MTLTextureDescriptor.texture2DDescriptor(
                pixelFormat: .rgba8Unorm,
                width: textureSize,
                height: textureSize,
                mipmapped: false
            )
            textureDescriptor.usage = [.shaderRead]
            textureDescriptor.storageMode = .shared
            
            // Create texture
            if let texture = device.makeTexture(descriptor: textureDescriptor) {
                texture.replace(
                    region: MTLRegionMake2D(0, 0, textureSize, textureSize),
                    mipmapLevel: 0,
                    withBytes: textureData,
                    bytesPerRow: bytesPerRow
                )
                backgroundTexture = texture
                print("Successfully created background texture: \(textureSize)x\(textureSize)")
            }
        }
        
        func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
            // Update screen center when size changes
            wobbleParams.screenCenter = SIMD2<Float>(Float(size.width/2), Float(size.height/2))
        }
        
        func draw(in view: MTKView) {
            guard let drawable = view.currentDrawable,
                  let pipelineState = pipelineState,
                  let commandBuffer = commandQueue?.makeCommandBuffer(),
                  let renderPassDescriptor = view.currentRenderPassDescriptor,
                  let renderEncoder = commandBuffer.makeRenderCommandEncoder(descriptor: renderPassDescriptor) else {
                print("Failed to get required Metal objects for rendering")
                return
            }
            
            // Debug checks
            guard let vertexBuffer = vertexBuffer else {
                print("Vertex buffer is nil")
                return
            }
            
            // Update time with a fixed delta time for consistent animation
            let currentTime = CACurrentMediaTime()
            let deltaTime = Float(currentTime - lastUpdateTime)
            lastUpdateTime = currentTime
            wobbleParams.time += deltaTime * 2.0  // Speed up the animation
            
            print("Current time: \(wobbleParams.time)")  // Debug print
            
            // Set up render pipeline
            renderEncoder.setRenderPipelineState(pipelineState)
            
            // Set vertex buffer and parameters
            renderEncoder.setVertexBuffer(vertexBuffer, offset: 0, index: 0)
            
            // Create a properly aligned buffer for the parameters
            let paramsSize = MemoryLayout<WobbleParams>.size
            let alignedSize = (paramsSize + 15) & ~15  // Round up to nearest 16 bytes
            var alignedParams = wobbleParams
            
            // Set vertex parameters
            renderEncoder.setVertexBytes(&alignedParams, length: alignedSize, index: 1)
            
            // Set fragment parameters
            renderEncoder.setFragmentBytes(&alignedParams, length: alignedSize, index: 0)
            
            if let texture = backgroundTexture {
                renderEncoder.setFragmentTexture(texture, index: 0)
            } else {
                print("Background texture is nil")
            }
            
            // Draw quad
            renderEncoder.drawPrimitives(type: .triangleStrip, vertexStart: 0, vertexCount: 4)
            
            renderEncoder.endEncoding()
            commandBuffer.present(drawable)
            commandBuffer.commit()
        }
    }
}
#endif

// Preview
struct FareyMetalView_Previews: PreviewProvider {
    static var previews: some View {
        FareyMetalViewRepresentable(primeFactor: 2.0, wobbleIntensity: 0.5, rotationSpeed: 1.0, isAnimating: true, mousePosition: .zero)
    }
} 
