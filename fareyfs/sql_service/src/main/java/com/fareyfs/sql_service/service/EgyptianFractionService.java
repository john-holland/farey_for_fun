package com.fareyfs.sql_service.service;

import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.math.BigInteger;

@Service
public class EgyptianFractionService {
    
    public List<BigInteger> toEgyptianFraction(BigInteger numerator, BigInteger denominator) {
        List<BigInteger> result = new ArrayList<>();
        
        if (numerator.equals(BigInteger.ZERO)) {
            return result;
        }
        
        if (denominator.equals(BigInteger.ZERO)) {
            throw new ArithmeticException("Division by zero");
        }
        
        // Handle negative numbers
        if (numerator.compareTo(BigInteger.ZERO) < 0) {
            result.add(BigInteger.valueOf(-1));
            numerator = numerator.abs();
        }
        
        while (!numerator.equals(BigInteger.ZERO)) {
            // Find the smallest unit fraction that is less than or equal to n/d
            BigInteger unitDenominator = denominator.divide(numerator).add(BigInteger.ONE);
            result.add(unitDenominator);
            
            // Update the remaining fraction
            numerator = numerator.multiply(unitDenominator).subtract(denominator);
            denominator = denominator.multiply(unitDenominator);
            
            // Simplify the fraction
            BigInteger gcd = numerator.gcd(denominator);
            if (!gcd.equals(BigInteger.ONE)) {
                numerator = numerator.divide(gcd);
                denominator = denominator.divide(gcd);
            }
        }
        
        return result;
    }
    
    public String toPrimeLogEncoding(List<BigInteger> egyptianFractions) {
        StringBuilder encoding = new StringBuilder();
        for (BigInteger fraction : egyptianFractions) {
            if (fraction.equals(BigInteger.valueOf(-1))) {
                encoding.append("-");
            } else {
                encoding.append(fraction.toString()).append(",");
            }
        }
        return encoding.toString();
    }
    
    public List<BigInteger> fromPrimeLogEncoding(String encoding) {
        List<BigInteger> result = new ArrayList<>();
        if (encoding == null || encoding.isEmpty()) {
            return result;
        }
        
        String[] parts = encoding.split(",");
        for (String part : parts) {
            if (part.equals("-")) {
                result.add(BigInteger.valueOf(-1));
            } else {
                result.add(new BigInteger(part));
            }
        }
        return result;
    }
} 