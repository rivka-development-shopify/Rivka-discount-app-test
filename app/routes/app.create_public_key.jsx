import { useEffect, useState } from "react";
import { json } from "@remix-run/node";

import {
  useSubmit,
  useActionData,
  useLoaderData
} from "@remix-run/react";

import {
  Page,
  LegacyCard,
  Button,
  IndexTable,
  TextField
} from "@shopify/polaris";

import {
  DeleteMinor
} from '@shopify/polaris-icons';


import {
  getPublicAuthKeys,
  createPublicAuthKey,
  deletePublicAuthKey
} from '../controllers/publicAuthKeysController';
import { parseFormDataToJson } from '../utils/formatData';


import { authenticate } from '../shopify.server';


// this is the method "get"
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const authKeys = await getPublicAuthKeys();
  return json({ shop: session.shop.replace(".myshopify.com", ""), authKeys });
};


export async function action({ request }) {
  try {
    const body = parseFormDataToJson(await request.formData())

    switch(request.method) {
      case 'POST':
        await createPublicAuthKey();
        break;
      case 'DELETE':
        await deletePublicAuthKey(body.authKeyId);
        break;
    }

    return { authKeys: await getPublicAuthKeys() };
  } catch (e) {
    console.error({ msg: "Error on remix landing page action", err: e})
    return null
  }
}

export default function Index() {
  const submit = useSubmit();
  const actionData = useActionData();
  const { authKeys: loaderAuthKeys } = useLoaderData();
  const [authKeys, setAuthKeys] = useState(loaderAuthKeys);

  useEffect(() => {
    if(actionData != null) {
      setAuthKeys(actionData.authKeys);
    }
  },
  [actionData])


  const handleNewAuthKey = () => {
    submit({}, {method: "POST"})
  };


  const handleDeleteAuthKey = async (authKeyId) => {
    submit({ authKeyId }, {method: "DELETE"})
  };


  return (
    <Page
      title="Public Auth Keys"
      subtitle="Create your own public auth keys"
      divider={true}
      primaryAction={{content: "Add New Public Auth Keys", onAction: handleNewAuthKey  }}
      // secondaryActions={[{content: "TEST", onAction: handleTest  }]}
      fullWidth={false}
    >
      <div className="discount-list">
        <LegacyCard title="Your Public Auth Keys" sectioned>
          <IndexTable
            resourceName={{singular: 'Public Auth Key', plural: 'Public Auth Keys'}}
            headings={[
              {title: 'Auth Key'},
              {title: 'Delete', hidden: true}
            ]}
            itemCount={authKeys.length}
            selectable={false}
          >
            {authKeys.map((authKey, index) => (
              <IndexTable.Row
                id={`${authKey.id}`}
                key={index}
                position={index}

              >
                  <IndexTable.Cell colSpan={90}>
                    <TextField
                      label=""
                      readOnly={true}
                      labelHidden={true}
                      value={authKey.key}
                      selectTextOnFocus
                      autoComplete="off"
                    />
                  </IndexTable.Cell>

                  <IndexTable.Cell colSpan={5}>
                    <div style={{display: "flex", alignItems: 'center', justifyContent: 'center'}}>
                      <Button
                        size="micro"
                        textAlign="center"
                        icon={DeleteMinor}
                        onClick={(e) => {e.preventDefault(); handleDeleteAuthKey(authKey.id)}}
                      ></Button>
                    </div>
                  </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>

        </LegacyCard>
      </div>
    </Page>
  );
}
