export const contributionRegistryAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_owner",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "submitter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "aiVerdict",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "submittedAt",
        "type": "uint256"
      }
    ],
    "name": "ContributionSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "verdict",
        "type": "uint8"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "proposalId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "notes",
        "type": "string"
      }
    ],
    "name": "ContributionResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "executor",
        "type": "address"
      }
    ],
    "name": "GovernanceExecutorUpdated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "contributionCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_contributionId",
        "type": "uint256"
      }
    ],
    "name": "getContribution",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "submitter",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "metadataURI",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "aiReport",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "aiVerdict",
            "type": "uint8"
          },
          {
            "components": [
              {
                "internalType": "uint16",
                "name": "technical",
                "type": "uint16"
              },
              {
                "internalType": "uint16",
                "name": "community",
                "type": "uint16"
              },
              {
                "internalType": "uint16",
                "name": "governance",
                "type": "uint16"
              },
              {
                "internalType": "uint16",
                "name": "overall",
                "type": "uint16"
              }
            ],
            "internalType": "struct ContributionRegistry.Score",
            "name": "score",
            "type": "tuple"
          },
          {
            "internalType": "uint256",
            "name": "submittedAt",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "finalVerdict",
            "type": "uint8"
          },
          {
            "internalType": "address",
            "name": "finalApprover",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "finalizedAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "proposalId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "notes",
            "type": "string"
          }
        ],
        "internalType": "struct ContributionRegistry.Contribution",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContributionIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_limit",
        "type": "uint256"
      }
    ],
    "name": "getContributions",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "submitter",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "metadataURI",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "aiReport",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "aiVerdict",
            "type": "uint8"
          },
          {
            "components": [
              {
                "internalType": "uint16",
                "name": "technical",
                "type": "uint16"
              },
              {
                "internalType": "uint16",
                "name": "community",
                "type": "uint16"
              },
              {
                "internalType": "uint16",
                "name": "governance",
                "type": "uint16"
              },
              {
                "internalType": "uint16",
                "name": "overall",
                "type": "uint16"
              }
            ],
            "internalType": "struct ContributionRegistry.Score",
            "name": "score",
            "type": "tuple"
          },
          {
            "internalType": "uint256",
            "name": "submittedAt",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "finalVerdict",
            "type": "uint8"
          },
          {
            "internalType": "address",
            "name": "finalApprover",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "finalizedAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "proposalId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "notes",
            "type": "string"
          }
        ],
        "internalType": "struct ContributionRegistry.Contribution[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "governanceExecutor",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextContributionId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_contributionId",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "_finalVerdict",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "_proposalId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_notes",
        "type": "string"
      }
    ],
    "name": "resolveContribution",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_executor",
        "type": "address"
      }
    ],
    "name": "setGovernanceExecutor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_metadataURI",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_aiReport",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "_aiVerdict",
        "type": "uint8"
      },
      {
        "internalType": "uint16",
        "name": "_technicalScore",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "_communityScore",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "_governanceScore",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "_overallScore",
        "type": "uint16"
      }
    ],
    "name": "submitContribution",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

