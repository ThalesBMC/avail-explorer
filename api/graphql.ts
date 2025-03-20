import { request, gql } from "graphql-request";
import { INDEXER_ENDPOINT } from "@/utils/constant";

// GraphQL query for getting latest transactions
export const GET_LATEST_TRANSACTIONS = gql`
  query GetLatestTransactions($first: Int = 10) {
    extrinsics(first: $first, orderBy: TIMESTAMP_DESC) {
      edges {
        node {
          id
          module
          timestamp
          txHash
          argsName
          argsValue
          extrinsicIndex
          hash
          success
          signature
          signer
          timestamp
          feesRounded
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_TOTAL_BLOB_SIZE = gql`
  query GetTotalBlobSize($first: Int = 100) {
    dataSubmissions(first: $first, orderBy: TIMESTAMP_DESC) {
      nodes {
        id
        byteSize
        timestamp
        fees
        feesPerMb
        appId
      }
      totalCount
      aggregates {
        sum {
          byteSize
        }
      }
    }
  }
`;

export const GET_24H_BLOB_SIZE = gql`
  query Get24hBlobSize {
    dataSubmissions(
      filter: {
        timestamp: {
          greaterThanOrEqualTo: "${new Date(
            Date.now() - 24 * 60 * 60 * 1000
          ).toISOString()}"
        }
      }
    ) {
      aggregates {
        sum {
          byteSize
        }
      }
      totalCount
    }
  }
`;

// Generic function to fetch data from the GraphQL API
export async function fetchGraphQLData<T>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  try {
    return await request(INDEXER_ENDPOINT, query, variables);
  } catch (error) {
    console.error("Error fetching data from GraphQL:", error);
    throw error;
  }
}
