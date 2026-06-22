import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Code,
} from '@chakra-ui/react';

const ASCII_DRAGON = `
                    /\\___/\\
                   (  o o  )
                   (  =^=  ) 
                    (____)
`;

const FileManager: React.FC = () => {
  const [url, setUrl] = useState('');
  const [path, setPath] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const toast = useToast();

  const handleFileUpload = async () => {
    if (!file || !url || !path) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields and select a file',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      const content = await file.arrayBuffer();
      const response = await fetch('http://localhost:8000/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          path,
          content: Array.from(new Uint8Array(content)),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'File uploaded successfully',
          status: 'success',
          duration: 3000,
        });
        setUrl('');
        setPath('');
        setFile(null);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/files/search?query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search files',
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
            Upload File
          </Text>
          <VStack spacing={4}>
            <Input
              placeholder="Enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Input
              placeholder="Enter path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
            />
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button colorScheme="blue" onClick={handleFileUpload}>
              Upload
            </Button>
          </VStack>
        </Box>

        <Box>
          <Text fontSize="lg" fontWeight="bold" mb={2}>
            Search Files
          </Text>
          <HStack>
            <Input
              placeholder="Enter search query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button colorScheme="blue" onClick={handleSearch}>
              Search
            </Button>
          </HStack>

          {searchResults.length > 0 && (
            <>
              <Table mt={4}>
                <Thead>
                  <Tr>
                    <Th>Type</Th>
                    <Th>URL</Th>
                    <Th>Path</Th>
                    <Th>Metadata</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {searchResults.map((result: any, index: number) => (
                    <Tr key={index}>
                      <Td>{result.type}</Td>
                      <Td>{result.url}</Td>
                      <Td>{result.path}</Td>
                      <Td>{JSON.stringify(result.metadata)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <Box mt={4} textAlign="center">
                <Code fontSize="sm" whiteSpace="pre">
                  {ASCII_DRAGON}
                </Code>
              </Box>
            </>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default FileManager; 