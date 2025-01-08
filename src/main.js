import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import './styles/common.css'
import { 
  Button,
  Input,
  Layout,
  Menu,
  Card,
  Table,
  Tag,
  Row,
  Col,
  Avatar,
  Space,
  Pagination,
  Dropdown,
  Divider,
  Form,
  Checkbox,
  Descriptions,
  Calendar,
  Tooltip,
  message,
  Tabs,
  Select,
  Modal,
  List
} from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

const app = createApp(App)

app.use(Button)
app.use(Input)
app.use(Layout)
app.use(Menu)
app.use(Card)
app.use(Table)
app.use(Tag)
app.use(Row)
app.use(Col)
app.use(Avatar)
app.use(Space)
app.use(Pagination)
app.use(Dropdown)
app.use(Divider)
app.use(Form)
app.use(Checkbox)
app.use(Descriptions)
app.use(Calendar)
app.use(Tooltip)
app.use(Tabs)
app.use(Select)
app.use(Modal)
app.use(List)

app.config.globalProperties.$message = message

app.use(router)
app.mount('#app')
