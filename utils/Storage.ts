import localforage from 'localforage'

const store = localforage.createInstance({
  name: 'TWG',
  storeName: 'twgStore',
  description: 'Used to store data for the talk-with-gemini project',
})

export default store
