import React, { useState, useEffect } from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
} from '@chakra-ui/react';
import FeatureToggles from './components/FeatureToggles';
import IPManagement from './components/IPManagement';
import FileManager from './components/FileManager';
import LogViewer from './components/LogViewer';

const API_BASE_URL = 'http://localhost:8000';

function App() {
  const [features, setFeatures] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [logs, setLogs] = useState([]);
  const toast = useToast();

  useEffect(() => {
    fetchFeatures();
    fetchIPLists();
    fetchLogs();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/features`);
      const data = await response.json();
      setFeatures(data);
    } catch (error) {
      toast({
        title: 'Error fetching features',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchIPLists = async () => {
    try {
      const [whitelistRes, blacklistRes] = await Promise.all([
        fetch(`${API_BASE_URL}/ip/whitelist`),
        fetch(`${API_BASE_URL}/ip/blacklist`),
      ]);
      const whitelistData = await whitelistRes.json();
      const blacklistData = await blacklistRes.json();
      setWhitelist(whitelistData);
      setBlacklist(blacklistData);
    } catch (error) {
      toast({
        title: 'Error fetching IP lists',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/logs`);
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      toast({
        title: 'Error fetching logs',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <ChakraProvider>
      <Box p={5}>
        <VStack spacing={5} align="stretch">
          <Heading>Farey WAN OS Management</Heading>
          
          <Tabs>
            <TabList>
              <Tab>Features</Tab>
              <Tab>IP Management</Tab>
              <Tab>Files</Tab>
              <Tab>Logs</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <FeatureToggles
                  features={features}
                  onToggle={fetchFeatures}
                />
              </TabPanel>
              
              <TabPanel>
                <IPManagement
                  whitelist={whitelist}
                  blacklist={blacklist}
                  onUpdate={fetchIPLists}
                />
              </TabPanel>
              
              <TabPanel>
                <FileManager />
              </TabPanel>
              
              <TabPanel>
                <LogViewer logs={logs} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App; 