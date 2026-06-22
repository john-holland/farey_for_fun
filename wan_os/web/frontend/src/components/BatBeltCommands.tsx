import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  useToast,
  Code,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';

interface Command {
  name: string;
  description: string;
  pattern: string;
}

const BatBeltCommands: React.FC = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [commandInput, setCommandInput] = useState('');
  const [commandResult, setCommandResult] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchCommands();
  }, []);

  const fetchCommands = async () => {
    try {
      const response = await fetch('http://localhost:8000/bat-belt/commands');
      const data = await response.json();
      setCommands(data);
    } catch (error) {
      toast({
        title: 'Error fetching commands',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleCommand = async () => {
    try {
      const response = await fetch('http://localhost:8000/bat-belt/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: commandInput }),
      });
      const data = await response.json();
      setCommandResult(data.result);
    } catch (error) {
      toast({
        title: 'Error executing command',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Bat_Belt Commands
          </Text>
          <HStack>
            <Input
              placeholder="Enter command (e.g., farey:search test)"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
            />
            <Button colorScheme="blue" onClick={handleCommand}>
              Execute
            </Button>
          </HStack>
        </Box>

        {commandResult && (
          <Box>
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              Result
            </Text>
            <Code p={4} borderRadius="md" bg="gray.100">
              {commandResult}
            </Code>
          </Box>
        )}

        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Available Commands
          </Text>
          <Table>
            <Thead>
              <Tr>
                <Th>Command</Th>
                <Th>Description</Th>
                <Th>Pattern</Th>
              </Tr>
            </Thead>
            <Tbody>
              {commands.map((cmd) => (
                <Tr key={cmd.name}>
                  <Td>{cmd.name}</Td>
                  <Td>{cmd.description}</Td>
                  <Td>
                    <Code>{cmd.pattern}</Code>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Box>
  );
};

export default BatBeltCommands; 