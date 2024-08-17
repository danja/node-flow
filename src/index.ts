import { NodeFlowGraph } from './graph';
import { FlowNode } from './node';
globalThis.NodeFlowGraph = NodeFlowGraph;
globalThis.FlowNode = FlowNode;

// Widgets
import { NumberWidget } from './widgets/number';
import { ColorWidget } from './widgets/color';
import { StringWidget } from './widgets/string';
import { ButtonWidget } from './widgets/button';
globalThis.NumberWidget = NumberWidget;
globalThis.ColorWidget = ColorWidget;
globalThis.StringWidget = StringWidget;
globalThis.ButtonWidget = ButtonWidget;
