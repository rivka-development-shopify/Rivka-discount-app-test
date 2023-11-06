import React, { useState, useEffect } from 'react';
import { ResourcePicker } from '@shopify/app-bridge-react';
import { Page, Layout, Card, Text, Button } from '@shopify/polaris';

export function CollectionsPicker(props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [initialSelection, setInitialSelection] = useState([]);

  useEffect(() => {
    if (selectedCollections.length === 0) {
      // Load initial selection only if no selections have been made
      setSelectedCollections(initialSelection);
    }
  }, [selectedCollections, initialSelection]);

  const handleSelection = (selection) => {
    console.log(selection)
    setIsOpen(false);
    setSelectedCollections(selection);
    setInitialSelection(selection)
  };

  const handleOpenPicker = () => {
    setIsOpen(true);
  };

  const handleCancelPicker = () => {
    setIsOpen(false);
  };

  return (
    <div>
      <Page
        title="Collection Selector"
        primaryAction={<Button onClick={handleOpenPicker}>Open Collection Selector</Button>}
      >
        <Layout>
          <Layout.Section>
            <Card>              
              <ul data-selection={selectedCollections}>
                {
                  selectedCollections.length >= 1 &&
                  selectedCollections.map((collection) => (
                    <li key={collection.id}>
                      <Text variant="headingMd" as='h2'>{collection.title}</Text>
                    </li>
                  ))
                }
              </ul>              
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
      <ResourcePicker
        resourceType="Collection"
        open={isOpen}
        initialSelectionIds={initialSelection} // Set initial selection
        onSelection={(resources) => handleSelection(resources.selection)}
        onCancel={handleCancelPicker}
      />
    </div>
  );
}
