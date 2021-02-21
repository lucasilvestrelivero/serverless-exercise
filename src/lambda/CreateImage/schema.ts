export default {
  type: "object",
  properties: {
    groupId: {type: 'string'},
    name: {type: 'string'},
  },
  required: ['groupId', 'name']
} as const;
