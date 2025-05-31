import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  List,
  ListItem,
  Text,
  IconButton,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';

interface Props {
  whitelist: string[];
  blacklist: string[];
  onUpdate: () => void;
}

const IPManagement: React.FC<Props> = ({ whitelist, blacklist, onUpdate }) => {
  const [newIP, setNewIP] = useState('');

  const handleAddIP = async (list: 'whitelist' | 'blacklist') => {
    try {
      await fetch(`http://localhost:8000/ip/${list}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip: newIP }),
      });
      setNewIP('');
      onUpdate();
    } catch (error) {
      console.error(`Error adding IP to ${list}:`, error);
    }
  };

  const handleRemoveIP = async (list: 'whitelist' | 'blacklist', ip: string) => {
    try {
      await fetch(`http://localhost:8000/ip/${list}/${ip}`, {
        method: 'DELETE',
      });
      onUpdate();
    } catch (error) {
      console.error(`Error removing IP from ${list}:`, error);
    }
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Add IP Address
          </Text>
          <HStack>
            <Input
              placeholder="Enter IP address"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
            />
            <Button
              colorScheme="green"
              onClick={() => handleAddIP('whitelist')}
            >
              Add to Whitelist
            </Button>
            <Button
              colorScheme="red"
              onClick={() => handleAddIP('blacklist')}
            >
              Add to Blacklist
            </Button>
          </HStack>
        </Box>

        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Whitelist
          </Text>
          <List spacing={2}>
            {whitelist.map((ip) => (
              <ListItem key={ip}>
                <HStack>
                  <Text>{ip}</Text>
                  <IconButton
                    aria-label="Remove from whitelist"
                    icon={<DeleteIcon />}
                    size="sm"
                    onClick={() => handleRemoveIP('whitelist', ip)}
                  />
                </HStack>
              </ListItem>
            ))}
          </List>
        </Box>

        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Blacklist
          </Text>
          <List spacing={2}>
            {blacklist.map((ip) => (
              <ListItem key={ip}>
                <HStack>
                  <Text>{ip}</Text>
                  <IconButton
                    aria-label="Remove from blacklist"
                    icon={<DeleteIcon />}
                    size="sm"
                    onClick={() => handleRemoveIP('blacklist', ip)}
                  />
                </HStack>
              </ListItem>
            ))}
          </List>
        </Box>
      </VStack>
    </Box>
  );
};

export default IPManagement; 