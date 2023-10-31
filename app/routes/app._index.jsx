import { useEffect, useState } from "react";
import { json, redirect } from "@remix-run/node";

import {
  useSubmit,
  useActionData,
  useLoaderData,
  useRevalidator,
  Link
} from "@remix-run/react";
import {
  Page,
  LegacyCard,
  Button,
  Text,
  IndexTable
} from "@shopify/polaris";

import {
  DeleteMinor
} from '@shopify/polaris-icons';

import Switch from "../components/Switch";

import { authenticate } from "../shopify.server";

import {
  deleteDiscountCode,
  createNewDiscountCode,
  toggleDiscountCode,
  getAllDiscountCodes
} from '../controllers/discountCodesControllers';
import { parseFormDataToJson } from '../utils/formatData';

// this is the method "get"
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const discountCodes = await getAllDiscountCodes();
  return json({ shop: session.shop.replace(".myshopify.com", ""), discountCodes });
};


// every time the submit fuction runs ends up here
export async function action({ request }) {
  try {
    // easier to work with JSON better then to work with FormData object
    const body = parseFormDataToJson(await request.formData())

    switch(request.method) {
      case 'POST':
        await createNewDiscountCode(body);
        break;
      case 'DELETE':
        await deleteDiscountCode(body.discountCodeId);
        break;
      case 'PUT':
        await toggleDiscountCode(body.discountCodeId, body.enabled);
        break;
    }

    return { discountCodes: await getAllDiscountCodes() };
  } catch (e) {
    console.error({ msg: "Error on remix landing page action", err: e})
    return null
  }
}

export default function Index() {
  const submit = useSubmit();
  const actionData = useActionData();
  const { discountCodes: loaderDiscountCodes } = useLoaderData();
  const [discountCodes, setDiscountCodes] = useState(loaderDiscountCodes);
  const revalidator = useRevalidator();

  useEffect(() => {
    if(actionData != null) {
      setDiscountCodes(actionData.discountCodes);
    }
  },
  [actionData])


  const handleNewDiscountCode = () => {
    submit({}, {method: "POST"})
  };

  const handleToggleSwitch = (discountCodeId, value) => {
    submit({ discountCodeId, enabled: !value }, {method: "PUT"})
  };

  const handleDeleteDiscountCode = async (discountCodeId) => {
    submit({ discountCodeId }, {method: "DELETE"})
  };

  return (
    <Page
      title="Custom Discount Codes"
      subtitle="Create your own shopify discount codes"
      divider={true}
      primaryAction={{content: "Add New Custom Discount Code", onAction: handleNewDiscountCode  }}
      fullWidth={false}
    >
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossOrigin="anonymous"/>

      {/* //ADD A SHOPIFY POLARIS SAVE BAR EVERYTIME discountCodeS STATE IS DIFFERENT FROM ORIGINAL discountCodeS */}
      <div className="discount-list">
        <LegacyCard title="Your Discount Codes" sectioned>
          <IndexTable
            resourceName={{singular: 'discount', plural: 'discounts'}}
            headings={[
              {title: 'Discount Code'},
              {title: 'Status'},
              {title: 'Delete', hidden: true}
            ]}
            itemCount={discountCodes.length}
            selectable={false}
          >
            {discountCodes.map((discountCode, index) => (
              <IndexTable.Row
                id={`${discountCode.id}`}
                key={index}
                position={index}
              >
                  <IndexTable.Cell>
                    <Link to={`/app/discount_edit/${discountCode.id}`} style={{ textDecoration: 'none', color: 'unset'}}>
                      <Text as={"dd"} >{discountCode.code}</Text>
                    </Link>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Switch
                      name="enabled"
                      id="enbled"
                      labelStyle={{
                        display: "none"
                      }}
                      checked={discountCode.enabled}
                      onChange={(e) => {e.preventDefault(); handleToggleSwitch(discountCode.id, discountCode.enabled)}}
                      label=""
                    />
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <div className="delete-button" style={{display: "flex", alignItems: "center", justifyContent: "flex-end"}}>
                      <Button
                        size="micro"
                        textAlign="center"
                        icon={DeleteMinor}
                        onClick={(e) => {e.preventDefault(); handleDeleteDiscountCode(discountCode.id)}}
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



{/* <ResourcePicker
selectMultiple={true}
open={showPicker}
showVariants={false}
resourceType={pickerType}
initialSelectionIds={pickerInitialSelectionIds}
onSelection={({selection}) => {handlePickerSelection(selection)}}
onCancel={(e) => {clearPickerState()}}
/> */}
