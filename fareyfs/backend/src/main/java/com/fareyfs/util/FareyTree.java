package com.fareyfs.util;

import java.util.*;
import java.math.BigInteger;
import com.fareyfs.model.FareyNode;
import org.springframework.stereotype.Component;

@Component
public class FareyTree {
    private static final BigInteger TWO = BigInteger.valueOf(2);
    private static final BigInteger THREE = BigInteger.valueOf(3);
    private static final BigInteger FIVE = BigInteger.valueOf(5);

    public BigInteger[] calculateFareyFraction(FareyNode parent) {
        if (parent == null) {
            return new BigInteger[]{BigInteger.ZERO, BigInteger.ONE};
        }

        BigInteger left = parent.getLeftDenominator();
        BigInteger right = parent.getRightDenominator();
        
        // Calculate the mediant
        BigInteger mediantLeft = left.add(right);
        BigInteger mediantRight = TWO.multiply(right);
        
        return new BigInteger[]{mediantLeft, mediantRight};
    }

    public String calculatePrimeLogEncoding(BigInteger left, BigInteger right) {
        Map<BigInteger, Integer> leftFactors = primeFactorization(left);
        Map<BigInteger, Integer> rightFactors = primeFactorization(right);
        
        StringBuilder encoding = new StringBuilder();
        
        // Encode left denominator
        for (Map.Entry<BigInteger, Integer> entry : leftFactors.entrySet()) {
            encoding.append(entry.getKey()).append("^").append(entry.getValue()).append(" ");
        }
        
        encoding.append("| ");
        
        // Encode right denominator
        for (Map.Entry<BigInteger, Integer> entry : rightFactors.entrySet()) {
            encoding.append(entry.getKey()).append("^").append(entry.getValue()).append(" ");
        }
        
        return encoding.toString().trim();
    }

    public List<BigInteger> calculateEgyptianFractions(BigInteger numerator, BigInteger denominator) {
        List<BigInteger> fractions = new ArrayList<>();
        
        while (!numerator.equals(BigInteger.ZERO)) {
            BigInteger ceil = denominator.add(numerator).subtract(BigInteger.ONE).divide(numerator);
            fractions.add(ceil);
            
            numerator = numerator.multiply(ceil).subtract(denominator);
            denominator = denominator.multiply(ceil);
            
            BigInteger gcd = numerator.gcd(denominator);
            numerator = numerator.divide(gcd);
            denominator = denominator.divide(gcd);
        }
        
        return fractions;
    }

    private Map<BigInteger, Integer> primeFactorization(BigInteger n) {
        Map<BigInteger, Integer> factors = new HashMap<>();
        
        // Handle 2
        while (n.mod(TWO).equals(BigInteger.ZERO)) {
            factors.merge(TWO, 1, Integer::sum);
            n = n.divide(TWO);
        }
        
        // Handle 3
        while (n.mod(THREE).equals(BigInteger.ZERO)) {
            factors.merge(THREE, 1, Integer::sum);
            n = n.divide(THREE);
        }
        
        // Handle 5
        while (n.mod(FIVE).equals(BigInteger.ZERO)) {
            factors.merge(FIVE, 1, Integer::sum);
            n = n.divide(FIVE);
        }
        
        // Handle remaining primes
        BigInteger i = BigInteger.valueOf(7);
        while (i.multiply(i).compareTo(n) <= 0) {
            while (n.mod(i).equals(BigInteger.ZERO)) {
                factors.merge(i, 1, Integer::sum);
                n = n.divide(i);
            }
            i = i.add(BigInteger.valueOf(4));
            
            while (n.mod(i).equals(BigInteger.ZERO)) {
                factors.merge(i, 1, Integer::sum);
                n = n.divide(i);
            }
            i = i.add(BigInteger.valueOf(2));
        }
        
        if (n.compareTo(BigInteger.ONE) > 0) {
            factors.put(n, 1);
        }
        
        return factors;
    }

    public void rebalanceTree(FareyNode root) {
        if (root == null) return;
        
        // Recalculate Farey fractions for all nodes
        Queue<FareyNode> queue = new LinkedList<>();
        queue.add(root);
        
        while (!queue.isEmpty()) {
            FareyNode node = queue.poll();
            
            // Recalculate Farey fraction
            BigInteger[] fraction = calculateFareyFraction(node.getParent());
            node.setLeftDenominator(fraction[0]);
            node.setRightDenominator(fraction[1]);
            
            // Update prime log encoding
            node.setPrimeLogEncoding(calculatePrimeLogEncoding(fraction[0], fraction[1]));
            
            // Add children to queue
            if (node.getChildren() != null) {
                queue.addAll(node.getChildren());
            }
        }
    }
} 