import { Widget } from "./widget";
import { NumberWidget } from './number';
import { ButtonWidget } from './button';
import { ColorWidget } from './color';
import { SliderWidget } from './slider';
import { StringWidget } from './string';
import { ToggleWidget } from './toggle';

export type WidgetBuilder = (confg?: any) => Widget;

class WidgetFactory {

    #registeredWidgets: Map<string, WidgetBuilder>

    constructor() {
        this.#registeredWidgets = new Map<string, WidgetBuilder>();
    }

    register(widgetType: string, builder: WidgetBuilder): void {
        this.#registeredWidgets.set(widgetType, builder);
    }

    create(widgetType: string, config: any): Widget {
        const builder = this.#registeredWidgets.get(widgetType)
        if (builder === undefined) {
            throw new Error("no builder registered for widget: " + widgetType);
        }
        return builder(config);
    }
}

const GlobalWidgetFactory = new WidgetFactory();

GlobalWidgetFactory.register("button", (config) => new ButtonWidget(config));
GlobalWidgetFactory.register("number", (config) => new NumberWidget(config));
GlobalWidgetFactory.register("color", (config) => new ColorWidget(config));
GlobalWidgetFactory.register("slider", (config) => new SliderWidget(config));
GlobalWidgetFactory.register("string", (config) => new StringWidget(config));
GlobalWidgetFactory.register("toggle", (config) => new ToggleWidget(config));

export { GlobalWidgetFactory };