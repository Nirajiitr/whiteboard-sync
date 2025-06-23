import React from 'react'
import Whiteboard from './components/Whiteboard/Whiteboard'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Homepage from './Homepage'

const App = () => {
  return (
    <div className='w-screen h-screen overflow-hidden overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100'> 
    
    
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Homepage/>} />
          <Route path='/whiteboard' element={<Whiteboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
