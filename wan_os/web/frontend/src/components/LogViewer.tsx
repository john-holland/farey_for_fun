import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
} from '@chakra-ui/react';

interface Log {
  timestamp: string;
  ip: string;
  feature: string;
  allowed: boolean;
  whitelisted: boolean;
  blacklisted: boolean;
}

interface Props {
  logs: Log[];
}

const LogViewer: React.FC<Props> = ({ logs }) => {
  return (
    <Box>
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Access Logs
      </Text>
      
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Timestamp</Th>
            <Th>IP</Th>
            <Th>Feature</Th>
            <Th>Allowed</Th>
            <Th>Whitelisted</Th>
            <Th>Blacklisted</Th>
          </Tr>
        </Thead>
        <Tbody>
          {logs.map((log, index) => (
            <Tr key={index}>
              <Td>{new Date(log.timestamp).toLocaleString()}</Td>
              <Td>{log.ip}</Td>
              <Td>{log.feature}</Td>
              <Td>{log.allowed ? 'Yes' : 'No'}</Td>
              <Td>{log.whitelisted ? 'Yes' : 'No'}</Td>
              <Td>{log.blacklisted ? 'Yes' : 'No'}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default LogViewer; 