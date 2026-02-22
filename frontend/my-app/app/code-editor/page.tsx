"use client";

import { CodeEditor } from './CodeEditor'
import { TerminalComp } from './TerminalComp'
const page = () => {
  return (
  <>
  <div>
    <div>code editor</div>
    <div className='h-115'>
      <CodeEditor />
    </div>
    <div className='h-25'><TerminalComp /></div>
  </div>  
    </>
  )
}

export default page
