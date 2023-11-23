// @ts-nocheck
import { json, redirect } from "@remix-run/node";

import { cors } from 'remix-utils/cors';


export const action = async ({ request }) => {
  return await cors(request, json(
    {
      body: {
        data: {
          err: 'Bad Request'
        }
      }
    },
    {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    }
  ));
};

export const loader = async ({ request }) => {
  const response = json(
    {
      body: {
        data: {
          test: process.env('DATABASE_URL')
        }
      }
    },
    {
      "Content-Type": "application/json",
      status: 400,
      headers: {
      },
    }
  );
  return await cors(request, response);
}
