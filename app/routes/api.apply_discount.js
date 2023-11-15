// @ts-nocheck
import { json } from "@remix-run/node";
import shopify from "../shopify.server";
import prisma from "../db.server";

import { cors } from 'remix-utils/cors';



export const loader = async ({ params, request }) => {
  // const { admin } = await shopify.authenticate.admin(request);

  const databaseSession = await prisma.session.findFirst()
  const { admin } = await shopify.unauthenticated.admin(databaseSession.shop)

  const response = await admin.graphql(
    `#graphql
      query GetDiscount($id: ID!) {
        discountNode(id: $id) {
          id
          configurationField: metafield(
            namespace: "$app:sku-discount"
            key: "function-configuration"
          ) {
            id
            value
          }
          discount {
            __typename
            ... on DiscountAutomaticApp {
              title
              discountClass
              combinesWith {
                orderDiscounts
                productDiscounts
                shippingDiscounts
              }
              startsAt
              endsAt
            }
            ... on DiscountCodeApp {
              title
              discountClass
              combinesWith {
                orderDiscounts
                productDiscounts
                shippingDiscounts
              }
              startsAt
              endsAt
              usageLimit
              appliesOncePerCustomer
              codes(first: 1) {
                nodes {
                  code
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        id: `gid://shopify/DiscountNode/1083043971224`,
      },
    }
  );

  const responseJson = await response.json();

  const endpointResponse = json(
    {
      body: {
        data: {
          responseJson
        }
      }
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return await cors(request, endpointResponse);
};
