import {
  checkEffects,
  checkFills,
  checkRadius,
  checkStrokes,
  checkType,
} from "../../../plugin/lintingFunctions";
import * as Networker from "monorepo-networker";

interface Payload {}

let borderRadiusArray = [0, 2, 4, 8, 16, 24, 32];
let originalNodeTree: readonly any[] = [];
let lintVectors = false;

export class StartLintMessage extends Networker.MessageType<
  Payload,
  {
    type: string;
    message: string;
    errors: any[];
  } | null
> {
  constructor(private side: Networker.Side) {
    super("start-lint-" + side.getName());
  }

  receivingSide(): Networker.Side {
    return this.side;
  }

  handle(payload: Payload, from: Networker.Side) {
    if (figma.currentPage.selection.length === 0) {
      figma.notify("Select a frame(s) to get started", { timeout: 2000 });
      return null;
    }
    const nodes = figma.currentPage.selection;
    const firstNode: any[] = [];

    firstNode.push(figma.currentPage.selection[0]);

    // Maintain the original tree structure so we can enable
    // refreshing the tree and live updating errors.
    originalNodeTree = nodes;

    // We want to immediately render the first selection
    // to avoid freezing up the UI.
    const data = {
      type: "lint-result",
      message: serializeNodes(nodes),
      errors: lint(firstNode),
    };
    return data;
  }
}

function serializeNodes(nodes: readonly SceneNode[]) {
  let serializedNodes = JSON.stringify(nodes, [
    "name",
    "type",
    "children",
    "id",
  ]);

  return serializedNodes;
}

function lint(nodes: any[], lockedParentNode = false) {
  let errorArray: any[] = [];

  // Use a for loop instead of forEach
  for (const node of nodes) {
    // Determine if the layer or its parent is locked.
    const isLayerLocked = lockedParentNode || node.locked;
    const nodeChildren = node.children;

    // Create a new object.
    const newObject = {
      id: node.id,
      errors: isLayerLocked ? [] : determineType(node),
      children: [],
    };

    // Check if the node has children.
    if (nodeChildren) {
      // Recursively run this function to flatten out children and grandchildren nodes.
      newObject.children = node.children.map((childNode: any) => childNode.id);
      errorArray.push(...lint(node.children, isLayerLocked));
    }

    errorArray.push(newObject);
  }

  return errorArray;
}

function determineType(node: any) {
  switch (node.type) {
    case "SLICE":
    case "GROUP": {
      // Groups styles apply to their children so we can skip this node type.
      let errors: any[] = [];
      return errors;
    }
    case "BOOLEAN_OPERATION":
    case "VECTOR": {
      return lintVectorRules(node);
    }
    case "POLYGON":
    case "STAR":
    case "ELLIPSE": {
      return lintShapeRules(node);
    }
    case "FRAME": {
      return lintFrameRules(node);
    }
    case "SECTION": {
      return lintSectionRules(node);
    }
    case "INSTANCE":
    case "RECTANGLE": {
      return lintRectangleRules(node);
    }
    case "COMPONENT": {
      return lintComponentRules(node);
    }
    case "COMPONENT_SET": {
      // Component Set is the frame that wraps a set of variants
      // the variants within the set are still linted as components (lintComponentRules)
      // this type is generally only present where the variant is defined so it
      // doesn't need as many linting requirements.
      return lintVariantWrapperRules(node);
    }
    case "TEXT": {
      return lintTextRules(node);
    }
    case "LINE": {
      return lintLineRules(node);
    }
    default: {
      // Do nothing
    }
  }
}

function lintComponentRules(node: any) {
  let errors: any[] = [];

  // Example of how we can make a custom rule specifically for components
  // if (node.remote === false) {
  //   errors.push(
  //     createErrorObject(node, "component", "Component isn't from library")
  //   );
  // }

  checkFills(node, errors);
  checkRadius(node, errors, borderRadiusArray);
  checkEffects(node, errors);
  checkStrokes(node, errors);

  return errors;
}

function lintVariantWrapperRules(node: any) {
  let errors: any[] = [];

  checkFills(node, errors);

  return errors;
}

function lintLineRules(node: any) {
  let errors: any[] = [];

  checkStrokes(node, errors);
  checkEffects(node, errors);

  return errors;
}

function lintFrameRules(node: any) {
  let errors: any[] = [];

  checkFills(node, errors);
  checkStrokes(node, errors);
  checkRadius(node, errors, borderRadiusArray);
  checkEffects(node, errors);

  return errors;
}

function lintSectionRules(node: any) {
  let errors: any[] = [];

  checkFills(node, errors);
  // For some reason section strokes aren't accessible via the API yet.
  // checkStrokes(node, errors);
  checkRadius(node, errors, borderRadiusArray);

  return errors;
}

function lintTextRules(node: any) {
  let errors: any[] = [];

  checkType(node, errors);
  checkFills(node, errors);

  // We could also comment out checkFills and use a custom function instead
  // Take a look at line 122 in lintingFunction.ts for an example.
  // customCheckTextFills(node, errors);
  checkEffects(node, errors);
  checkStrokes(node, errors);

  return errors;
}

function lintRectangleRules(node: any) {
  let errors: any[] = [];

  checkFills(node, errors);
  checkRadius(node, errors, borderRadiusArray);
  checkStrokes(node, errors);
  checkEffects(node, errors);

  return errors;
}

function lintVectorRules(node: any) {
  let errors: any[] = [];

  // This can be enabled by the user in settings.
  if (lintVectors === true) {
    checkFills(node, errors);
    checkStrokes(node, errors);
    checkEffects(node, errors);
  }

  return errors;
}

function lintShapeRules(node: any) {
  let errors: any[] = [];

  checkFills(node, errors);
  checkStrokes(node, errors);
  checkEffects(node, errors);

  return errors;
}
