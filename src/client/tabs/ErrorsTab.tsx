import { useEffect, useState } from "react";
import { Icon } from "../components/icon/Icon.js";
import { useHtmlErrors } from "../context/useRDTContext.js";
import { useDevServerConnection } from "../hooks/useDevServerConnection.js";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import beautify from "beautify";
// @ts-expect-error
const DiffViewer: typeof ReactDiffViewer.default = ReactDiffViewer.default ? (ReactDiffViewer.default as any) : (ReactDiffViewer as any);
 

const ErrorsTab = () => {
  const { htmlErrors } = useHtmlErrors();
  const { sendJsonMessage } = useDevServerConnection(); 
  const [SSRHtml, setSSRHtml] = useState("");
  const [CSRHtml, setCSRHtml] = useState(""); 
  const [hasHydrationMismatch, setHasHydrationMismatch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.HYDRATION_OVERLAY) { 
      return;
    }
    const ssrHtml = window.HYDRATION_OVERLAY?.SSR_HTML;
    const newCSRHtml = window.HYDRATION_OVERLAY?.CSR_HTML;

    if (!ssrHtml || !newCSRHtml) return;

    const newSSR = beautify( (ssrHtml), { format: "html" });
    const newCSR = beautify( (newCSRHtml), { format: "html" });
    setSSRHtml(newSSR);
    setCSRHtml(newCSR);
    setHasHydrationMismatch(window.HYDRATION_OVERLAY?.ERROR??false);
  }, []);

  return (
    <div className="rdt-flex rdt-flex-col rdt-gap-1">
        {htmlErrors.length > 0 ? (
        <>
          <h1 className="rdt-text-xl">HTML Nesting Errors</h1>
          <hr className="rdt-mb-1 rdt-border-gray-600/30" />
        </>
      ) : (
        <h1 className="rdt-text-xl">No errors detected!</h1>
      )}
      {htmlErrors.map((error) => {
        return (
          <div
            key={JSON.stringify(error)}
            className="rdt-flex rdt-justify-start rdt-gap-2 rdt-rounded-lg rdt-border rdt-border-solid rdt-border-red-600/20 rdt-p-2"
          >
            <Icon size="md" className="rdt-text-red-600" name="Shield" />
            <div className="rdt-flex rdt-flex-col">
              <div>
                <span className="rdt-font-bold rdt-text-red-600">{error.child.tag}</span> element can't be nested inside
                of <span className="rdt-font-bold rdt-text-red-600">{error.parent.tag}</span> element
              </div>
              <div className="rdt-flex rdt-items-center rdt-gap-1 rdt-text-sm rdt-text-gray-500">
                The parent element is located inside of the
                <div
                  onClick={() =>
                    sendJsonMessage({
                      type: "open-source",
                      data: { source: error.parent.file.replace(".tsx", "") },
                    })
                  }
                  className="rdt-cursor-pointer rdt-text-white"
                >
                  {error.parent.file}
                </div>
                file
              </div>
              <div className="rdt-flex rdt-items-center rdt-gap-1 rdt-text-sm rdt-text-gray-500">
                The child element is located inside of the
                <div
                  onClick={() =>
                    sendJsonMessage({
                      type: "open-source",
                      data: { source: error.child.file.replace(".tsx", "") },
                    })
                  }
                  className="rdt-cursor-pointer rdt-text-white"
                >
                  {error.child.file}
                </div>
                file
              </div>
            </div>
          </div>
        );
      })}
      {hasHydrationMismatch && <div className="rdt-relative rdt-mt-4 rdt-w-full rdt-border-2 rdt-rounded rdt-border-gray-800">
        <h1 className="rdt-text-xl rdt-p-2 rdt-text-center">Hydration mismatch comparison</h1>
        <hr className="rdt-mb-1 rdt-border-gray-600/30" />
        <DiffViewer
          oldValue={SSRHtml}
          newValue={CSRHtml}
          leftTitle={"Server-Side Render"}
          rightTitle={"Client-Side Render"}
          compareMethod={DiffMethod.WORDS}
           styles={{ 
            titleBlock: {
              textAlign: 'center',
            },
            variables: {
              dark: { 
                diffViewerBackground: '#212121',
                diffViewerColor: '#FFF',
                addedBackground: '#044B53',
                addedColor: 'white',
                removedBackground: '#632F34',
                removedColor: 'white',
                wordAddedBackground: '#055d67',
                wordRemovedBackground: '#7d383f',
                addedGutterBackground: '#034148',
                removedGutterBackground: '#632b30',
                gutterBackground: '#1F2937', 
                highlightBackground: '#212121',
                highlightGutterBackground: '#212121',
                codeFoldGutterBackground: '#1F2937',
                codeFoldBackground: '#1F2937',
                emptyLineBackground: '#363946',
                gutterColor: '#white',
                addedGutterColor: '#8c8c8c',
                removedGutterColor: '#8c8c8c',
                codeFoldContentColor: 'white',
                diffViewerTitleBackground: '#212121',
                diffViewerTitleColor: 'white',
                diffViewerTitleBorderColor: '#353846',
              }
            }
           }}
          extraLinesSurroundingDiff={2}
          useDarkTheme={true}
        />
      </div>}
    
    </div>
  );
};

export { ErrorsTab };
