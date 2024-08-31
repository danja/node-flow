import { NodeFlowGraph } from './graph';
import { FlowNode } from './node';
import { Theme } from './theme';
globalThis.NodeFlowGraph = NodeFlowGraph;
globalThis.FlowNode = FlowNode;
globalThis.NodeFlowTheme = Theme;

// Widgets
import { NumberWidget } from './widgets/number';
import { ColorWidget } from './widgets/color';
import { StringWidget } from './widgets/string';
import { ButtonWidget } from './widgets/button';
import { ToggleWidget } from './widgets/toggle';
import { SliderWidget } from './widgets/slider';
import { GlobalWidgetFactory } from './widgets/factory';
globalThis.NumberWidget = NumberWidget;
globalThis.ColorWidget = ColorWidget;
globalThis.StringWidget = StringWidget;
globalThis.ButtonWidget = ButtonWidget;
globalThis.ToggleWidget = ToggleWidget;
globalThis.SliderWidget = SliderWidget;
globalThis.GlobalWidgetFactory = GlobalWidgetFactory;
