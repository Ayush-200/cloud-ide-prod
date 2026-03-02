"use client";

import { CodeEditor } from './CodeEditor'
import FolderPane from './FolderPane';
import { TerminalComp } from './TerminalComp'
const page = () => {
  return (
  <>
  <>
  <div className="h-screen flex flex-col">

    {/* Top Section: Editor Area */}
    <div className="flex-[7] flex overflow-hidden">

      {/* Sidebar */}
      <div className="w-64 border-r border-gray-700 overflow-auto">
        <FolderPane />
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden">
        <CodeEditor />
      </div>

    </div>

    {/* Bottom Section: Terminal */}
    <div className="flex-[3] border-t border-gray-700 overflow-hidden">
      <TerminalComp />
    </div>

  </div>
</> 
    </>
  )
}

export default page
