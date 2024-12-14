const contractABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "creatorId",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "noteId",
        type: "bytes32",
      },
    ],
    name: "NoteDataAdded",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_creatorId",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_noteId",
        type: "bytes32",
      },
    ],
    name: "addNoteData",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_creatorId",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "_noteId",
        type: "bytes32",
      },
    ],
    name: "getNoteData",
    outputs: [
      {
        components: [
          {
            internalType: "bytes32",
            name: "creatorId",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "noteId",
            type: "bytes32",
          },
        ],
        internalType: "struct NoteDataRegistry.NoteData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "noteData",
    outputs: [
      {
        internalType: "bytes32",
        name: "creatorId",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "noteId",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

module.exports = contractABI;
