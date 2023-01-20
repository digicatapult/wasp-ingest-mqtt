const jwtMatch = /^Bearer jwt_([0-9a-zA-Z._-]+)$/
const subjectMatch = /^([a-zA-Z_]+)\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})$/
const topicMatch = /^things\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\/messages$/

const jwtFormat = (s) => ('' + s).match(jwtMatch)
const subjectFormat = (s) => ('' + s).match(subjectMatch)
const topicFormat = (s) => ('' + s).match(topicMatch)

export { jwtFormat, subjectFormat, topicFormat }
