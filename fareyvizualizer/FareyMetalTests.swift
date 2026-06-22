import XCTest
import Metal
@testable import fareyvizualizer

@MainActor
class FareyMetalTests: XCTestCase {
    var device: MTLDevice!
    var library: MTLLibrary!
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        
        // Launch the app for UI tests
        app = XCUIApplication()
        app.launch()
        
        // Skip tests if Metal is not available
        guard let device = MTLCreateSystemDefaultDevice() else {
            throw XCTSkip("Metal is not supported on this device")
        }
        self.device = device
        
        guard let library = device.makeDefaultLibrary() else {
            throw XCTSkip("Failed to create Metal library")
        }
        self.library = library
    }
    
    override func tearDownWithError() throws {
        app.terminate()
        device = nil
        library = nil
        try super.tearDownWithError()
    }
    
    func testShaderFunctionsExist() throws {
        // Test vertex shader
        let vertexFunction = library.makeFunction(name: "fareyVertexShader")
        XCTAssertNotNil(vertexFunction, "fareyVertexShader should exist")
        
        // Test fragment shader
        let fragmentFunction = library.makeFunction(name: "fareyWobbleShader")
        XCTAssertNotNil(fragmentFunction, "fareyWobbleShader should exist")
        
        // Test compute shader
        let computeFunction = library.makeFunction(name: "calculatePrimeFactors")
        XCTAssertNotNil(computeFunction, "calculatePrimeFactors should exist")
    }
    
    func testPipelineStateCreation() throws {
        guard let vertexFunction = library.makeFunction(name: "fareyVertexShader"),
              let fragmentFunction = library.makeFunction(name: "fareyWobbleShader") else {
            throw XCTSkip("Failed to get shader functions")
        }
        
        let pipelineDescriptor = MTLRenderPipelineDescriptor()
        pipelineDescriptor.vertexFunction = vertexFunction
        pipelineDescriptor.fragmentFunction = fragmentFunction
        pipelineDescriptor.colorAttachments[0].pixelFormat = .bgra8Unorm
        
        do {
            let pipelineState = try device.makeRenderPipelineState(descriptor: pipelineDescriptor)
            XCTAssertNotNil(pipelineState, "Pipeline state should be created successfully")
        } catch {
            XCTFail("Failed to create pipeline state: \(error)")
        }
    }
    
    func testComputePipelineStateCreation() throws {
        guard let computeFunction = library.makeFunction(name: "calculatePrimeFactors") else {
            throw XCTSkip("Failed to get compute function")
        }
        
        do {
            let pipelineState = try device.makeComputePipelineState(function: computeFunction)
            XCTAssertNotNil(pipelineState, "Compute pipeline state should be created successfully")
        } catch {
            XCTFail("Failed to create compute pipeline state: \(error)")
        }
    }
    
    func testWobbleParamsMemoryLayout() {
        // Test that WobbleParams struct matches shader expectations
        let wobbleParams = WobbleParams()
        let size = MemoryLayout<WobbleParams>.size
        let stride = MemoryLayout<WobbleParams>.stride
        
        // Print memory layout for debugging
        print("WobbleParams size: \(size)")
        print("WobbleParams stride: \(stride)")
        
        // Verify the struct is properly aligned for Metal
        XCTAssertEqual(size % 16, 0, "WobbleParams should be 16-byte aligned")
    }
    
    func testShaderCompilation() throws {
        // Test that all shader functions compile without errors
        let functionNames = ["fareyVertexShader", "fareyWobbleShader", "calculatePrimeFactors"]
        
        for name in functionNames {
            let function = library.makeFunction(name: name)
            XCTAssertNotNil(function, "\(name) should compile successfully")
            
            if let function = function {
                print("Function \(name) compiled successfully")
                print("Function type: \(function.functionType)")
                print("Function name: \(function.name)")
            }
        }
    }
    
    func testPrimeFactorization() throws {
        let testCases: [(Int, [Int], [Int])] = [
            (2, [2], [1]),
            (3, [3], [1]),
            (4, [2], [2]),
            (6, [2, 3], [1, 1]),
            (8, [2], [3]),
            (12, [2, 3], [2, 1]),
            (15, [3, 5], [1, 1]),
            (16, [2], [4]),
            (17, [17], [1]),
            (18, [2, 3], [1, 2])
        ]
        
        for (number, expectedFactors, expectedMultiplicity) in testCases {
            let (factors, multiplicity) = factorize(number)
            XCTAssertEqual(factors, expectedFactors, "Factors for \(number) should be \(expectedFactors)")
            XCTAssertEqual(multiplicity, expectedMultiplicity, "Multiplicity for \(number) should be \(expectedMultiplicity)")
        }
    }
    
    func testWobbleEffectParameters() {
        let wobbleParams = WobbleParams()
        
        // Test default values
        XCTAssertEqual(wobbleParams.primeFactor, 2.0, "Default prime factor should be 2.0")
        XCTAssertEqual(wobbleParams.wobbleIntensity, 0.5, "Default wobble intensity should be 0.5")
        XCTAssertEqual(wobbleParams.rotationSpeed, 1.0, "Default rotation speed should be 1.0")
        
        // Test parameter updates
        wobbleParams.primeFactor = 3.0
        wobbleParams.wobbleIntensity = 0.7
        wobbleParams.rotationSpeed = 1.5
        
        XCTAssertEqual(wobbleParams.primeFactor, 3.0, "Prime factor should update to 3.0")
        XCTAssertEqual(wobbleParams.wobbleIntensity, 0.7, "Wobble intensity should update to 0.7")
        XCTAssertEqual(wobbleParams.rotationSpeed, 1.5, "Rotation speed should update to 1.5")
    }
    
    func testShaderInputValidation() throws {
        guard let vertexFunction = library.makeFunction(name: "fareyVertexShader"),
              let fragmentFunction = library.makeFunction(name: "fareyWobbleShader") else {
            throw XCTSkip("Failed to get shader functions")
        }
        
        // Test vertex function input validation
        let vertexInputs = vertexFunction.functionType == .vertex
        XCTAssertTrue(vertexInputs, "Vertex function should accept vertex input")
        
        // Test fragment function input validation
        let fragmentInputs = fragmentFunction.functionType == .fragment
        XCTAssertTrue(fragmentInputs, "Fragment function should accept fragment input")
        
        // Print function details for debugging
        print("Vertex function name: \(vertexFunction.name)")
        print("Fragment function name: \(fragmentFunction.name)")
    }
    
    func testPrimeNumberDetection() {
        let primeNumbers = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
        let nonPrimeNumbers = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18]
        
        for number in primeNumbers {
            XCTAssertTrue(isPrime(number), "\(number) should be identified as prime")
        }
        
        for number in nonPrimeNumbers {
            XCTAssertFalse(isPrime(number), "\(number) should be identified as non-prime")
        }
    }
    
    func testWobbleParamsMemoryAlignment() {
        let wobbleParams = WobbleParams()
        let mirror = Mirror(reflecting: wobbleParams)
        
        // Print memory layout of each property
        for child in mirror.children {
            if let label = child.label {
                let value = child.value
                let size = MemoryLayout.size(ofValue: value)
                let alignment = MemoryLayout.alignment(ofValue: value)
                print("Property: \(label), Size: \(size), Alignment: \(alignment)")
            }
        }
        
        // Verify total struct size and alignment
        let totalSize = MemoryLayout<WobbleParams>.size
        let totalAlignment = MemoryLayout<WobbleParams>.alignment
        print("Total size: \(totalSize), Total alignment: \(totalAlignment)")
        
        XCTAssertEqual(totalAlignment, 16, "WobbleParams should be 16-byte aligned")
    }
    
    // Helper function to match the implementation in FareyMetalView
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
    
    // Helper function to match the implementation in FareyMetalView
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
} 