import React from 'react';
import {
  Box,
  Switch,
  FormControl,
  FormLabel,
  VStack,
  Text,
} from '@chakra-ui/react';

interface Feature {
  name: string;
  description: string;
  enabled: boolean;
}

interface Props {
  features: Feature[];
  onToggle: () => void;
}

const FeatureToggles: React.FC<Props> = ({ features, onToggle }) => {
  const handleToggle = async (feature: Feature) => {
    try {
      await fetch(`http://localhost:8000/features/${feature.name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: feature.name,
          enabled: !feature.enabled,
        }),
      });
      onToggle();
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {features.map((feature) => (
          <FormControl key={feature.name} display="flex" alignItems="center">
            <FormLabel htmlFor={feature.name} mb="0">
              {feature.name}
            </FormLabel>
            <Switch
              id={feature.name}
              isChecked={feature.enabled}
              onChange={() => handleToggle(feature)}
            />
            <Text ml={4} color="gray.500">
              {feature.description}
            </Text>
          </FormControl>
        ))}
      </VStack>
    </Box>
  );
};

export default FeatureToggles; 