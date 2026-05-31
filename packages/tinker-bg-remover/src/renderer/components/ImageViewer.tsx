import { observer } from 'mobx-react-lite'
import store from '../store'
import ProcessingOverlay from './ProcessingOverlay'

const ImageViewer = observer(() => (
  <div className="h-full flex items-center justify-center relative animate-fade-in p-3">
    {store.isProcessing && <ProcessingOverlay />}
    <img
      src={store.displayImage || ''}
      alt=""
      className={`max-w-full max-h-full object-contain rounded-md ${
        store.resultImage ? 'checkerboard-bg' : ''
      }`}
    />
  </div>
))

export default ImageViewer
