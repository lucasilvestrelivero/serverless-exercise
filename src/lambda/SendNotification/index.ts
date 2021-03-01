
export default {
  handler: `${__dirname.split(process.cwd())[1].substring(1).replace(/\\/g, '/')}/handler.main`,
  events: [
    {
      sns: {
				arn: {
					"Fn::Join": [
            ":",
						[
              "arn:aws:sns",
              { Ref: "AWS::Region" },
              { Ref: "AWS::AccountId" },
              "${self:provider.environment.TOPIC_NAME}"
            ]
					]
				},
				topicName: "${self:provider.environment.TOPIC_NAME}"
			}
    }
  ]
}
