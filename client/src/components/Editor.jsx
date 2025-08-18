import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { useSyncDemo } from '@tldraw/sync'

const Editor = ({roomId}) => {

  const store = useSyncDemo({ roomId })

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <Tldraw  store={store} />
    </div>
)}

export default Editor