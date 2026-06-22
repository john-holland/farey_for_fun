import SwiftUI

struct ContentView: View {
    @State private var primeFactor: Float = 2.0
    @State private var wobbleIntensity: Float = 0.5
    @State private var rotationSpeed: Float = 1.0
    @State private var showControls: Bool = true
    @State private var isFullscreen: Bool = true
    @State private var isAnimating: Bool = true
    
    var body: some View {
        ZStack {
            // Metal view
            FareyMetalViewRepresentable(
                primeFactor: primeFactor,
                wobbleIntensity: wobbleIntensity,
                rotationSpeed: rotationSpeed,
                isAnimating: isAnimating
            )
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .edgesIgnoringSafeArea(isFullscreen ? .all : [])
            
            // Control panel
            VStack {
                if showControls {
                    ControlPanel(
                        primeFactor: $primeFactor,
                        wobbleIntensity: $wobbleIntensity,
                        rotationSpeed: $rotationSpeed,
                        isFullscreen: $isFullscreen,
                        isAnimating: $isAnimating
                    )
                    .transition(.move(edge: .top))
                }
                
                Spacer()
                
                // Animation control button
                Button(action: {
                    withAnimation {
                        isAnimating.toggle()
                    }
                }) {
                    Image(systemName: isAnimating ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: 44))
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.black.opacity(0.5))
                        .clipShape(Circle())
                }
                .padding(.bottom, 20)
                
                // Toggle button
                Button(action: {
                    withAnimation {
                        showControls.toggle()
                    }
                }) {
                    Image(systemName: showControls ? "chevron.down" : "chevron.up")
                        .font(.title)
                        .foregroundColor(.white)
                        .padding()
                        .background(Color.black.opacity(0.5))
                        .clipShape(Circle())
                }
                .padding(.bottom)
            }
        }
        .toolbar {
            ToolbarItem(placement: .automatic) {
                Menu {
                    Button(action: { isAnimating.toggle() }) {
                        Label(isAnimating ? "Pause Animation" : "Start Animation", 
                              systemImage: isAnimating ? "pause" : "play")
                    }
                    
                    Divider()
                    
                    Button(action: { isFullscreen.toggle() }) {
                        Label(isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen", 
                              systemImage: isFullscreen ? "arrow.down.right.and.arrow.up.left" : "arrow.up.left.and.arrow.down.right")
                    }
                    
                    Divider()
                    
                    Button(action: { showControls.toggle() }) {
                        Label(showControls ? "Hide Controls" : "Show Controls", 
                              systemImage: showControls ? "eye.slash" : "eye")
                    }
                    
                    Divider()
                    
                    Menu("Presets") {
                        Button("Default") {
                            primeFactor = 2.0
                            wobbleIntensity = 0.5
                            rotationSpeed = 1.0
                        }
                        Button("Intense") {
                            primeFactor = 3.0
                            wobbleIntensity = 0.8
                            rotationSpeed = 1.5
                        }
                        Button("Subtle") {
                            primeFactor = 2.0
                            wobbleIntensity = 0.3
                            rotationSpeed = 0.5
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.title2)
                }
            }
        }
    }
}

struct ControlPanel: View {
    @Binding var primeFactor: Float
    @Binding var wobbleIntensity: Float
    @Binding var rotationSpeed: Float
    @Binding var isFullscreen: Bool
    @Binding var isAnimating: Bool
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Farey Visualizer Controls")
                .font(.title)
                .foregroundColor(.white)
            
            VStack(alignment: .leading, spacing: 10) {
                // Animation Toggle
                Toggle("Animation", isOn: $isAnimating)
                    .foregroundColor(.white)
                    .padding(.bottom, 5)
                
                // Fullscreen Toggle
                Toggle("Fullscreen", isOn: $isFullscreen)
                    .foregroundColor(.white)
                    .padding(.bottom, 5)
                
                // Prime Factor Control
                VStack(alignment: .leading) {
                    Text("Prime Factor: \(Int(primeFactor))")
                        .foregroundColor(.white)
                    Slider(value: $primeFactor, in: 2...100, step: 1)
                        .accentColor(.blue)
                }
                
                // Wobble Intensity Control
                VStack(alignment: .leading) {
                    Text("Wobble Intensity: \(wobbleIntensity, specifier: "%.2f")")
                        .foregroundColor(.white)
                    Slider(value: $wobbleIntensity, in: 0...1)
                        .accentColor(.green)
                }
                
                // Rotation Speed Control
                VStack(alignment: .leading) {
                    Text("Rotation Speed: \(rotationSpeed, specifier: "%.2f")")
                        .foregroundColor(.white)
                    Slider(value: $rotationSpeed, in: 0...2)
                        .accentColor(.purple)
                }
            }
            .padding()
            .background(Color.black.opacity(0.7))
            .cornerRadius(15)
        }
        .padding()
    }
}

#Preview {
    ContentView()
} 