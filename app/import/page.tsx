"use client";
import { ImportPage } from "../pages/ImportPage";
import { SignInPage } from "../components/SignInPage";

import { Authenticated, Unauthenticated } from 'convex/react'



export default function ImportRoutePage() {
  return (
    <>
      <Authenticated>
        <Content />
      </Authenticated>

      <Unauthenticated>
        <SignInPage />
      </Unauthenticated>
    </>
  )
}


function Content() {
  
  return <ImportPage />
}

