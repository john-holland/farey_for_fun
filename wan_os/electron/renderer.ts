import { ipcRenderer } from 'electron';
import {
  Box,
  VStack,
  Button,
  Text,
  useToast,
  Progress,
  List,
  ListItem,
} from '@chakra-ui/react';
import React, { useState } from 'react';

const FareyClient: React.FC = () => {
  const [selectedDir, setSelectedDir] = useState<string | null>(null);
  const [files, setFiles] = useState<Array<{ path: string; relativePath: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const toast = useToast();

  const handleSelectDirectory = async () => {
    const dirPath = await ipcRenderer.invoke('select-directory');
    if (dirPath) {
      setSelectedDir(dirPath);
      const structure = await ipcRenderer.invoke('get-directory-structure', dirPath);
      setFiles(structure);
    }
  };

  const handleUpload = async () => {
    if (!selectedDir) return;

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await ipcRenderer.invoke('read-file', file.path);
        
        if (result.success) {
          const url = `file://${selectedDir}`;
          const uploadResult = await ipcRenderer.invoke('add-to-farey', {
            url,
            path: file.relativePath,
            content: result.content,
          });

          if (!uploadResult.success) {
            throw new Error(`Failed to upload ${file.relativePath}`);
          }
        }

        setProgress(((i + 1) / files.length) * 100);
      }

      toast({
        title: 'Success',
        description: 'All files uploaded successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box p={5}>
      <VStack spacing={6} align="stretch">
        <Text fontSize="2xl" fontWeight="bold">
          Farey WAN OS Client
        </Text>

        <Button
          colorScheme="blue"
          onClick={handleSelectDirectory}
          isDisabled={uploading}
        >
          Select Directory
        </Button>

        {selectedDir && (
          <Text>
            Selected Directory: {selectedDir}
          </Text>
        )}

        {files.length > 0 && (
          <>
            <Text fontSize="lg" fontWeight="bold">
              Files to Upload ({files.length})
            </Text>
            <List spacing={2}>
              {files.map((file, index) => (
                <ListItem key={index}>
                  {file.relativePath}
                </ListItem>
              ))}
            </List>

            <Button
              colorScheme="green"
              onClick={handleUpload}
              isDisabled={uploading}
            >
              Upload to FareyFS
            </Button>

            {uploading && (
              <Progress value={progress} size="sm" colorScheme="blue" />
            )}
          </>
        )}
      </VStack>
    </Box>
  );
};

export default FareyClient; 