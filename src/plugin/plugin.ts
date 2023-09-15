import * as Networker from "monorepo-networker";
import { initializeNetwork } from "@common/network/init";
import { NetworkSide } from "@common/network/sides";
import { NetworkMessages } from "@common/network/messages";

async function bootstrap() {
  initializeNetwork(NetworkSide.PLUGIN);

  if (figma.editorType === "figma") {
    figma.showUI(__html__, {
      width: 800,
      height: 650,
      title: "My Figma Plugin!",
    });
  } else if (figma.editorType === "figjam") {
    figma.showUI(__html__, {
      width: 800,
      height: 650,
      title: "My FigJam Plugin!",
    });
  }

  console.log("Bootstrapped @", Networker.Side.current.getName());

  NetworkMessages.HELLO_UI.send({ text: "Hey there, UI!" });
}

figma.on("documentchange", (_event) => {
  // When a change happens in the document
  // send a message to the plugin to look for changes.'
  // figma.ui.postMessage({
  //   type: "change"
  // });
});

// figma.on("selectionchange", () => {
//   console.log("Selection changed");
//   const { selection } = figma.currentPage;
//   if (selection.length) {
//     NetworkMessages.SELECTION_CHANGE.send({ selection: selection[0] });
//   }
// });

bootstrap();
