import ProtoFlowApp from './ProtoFlowApp'
import appJson from '../examples/smart-customer-service-app.json'
import type { App } from './types'

function App() {
  // 使用类型断言确保 JSON 数据符合 App 类型
  return <ProtoFlowApp app={appJson.app as App} />
}

export default App