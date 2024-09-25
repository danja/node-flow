import { Popup } from "../popup";

interface FormValue {
    name: string;
    type: string;
    startingValue: any;
}

interface Config {
    title: string;
    form: Array<FormValue>;
    onUpdate: (newValue: Array<any>) => void;
    onCancel?: () => void;
}

export function FormPopup(config: Config): Popup {
    let input = new Array<HTMLInputElement | null>();

    return new Popup({
        title: config.title,
        options: ["Set", "Cancel"],
        content: () => {
            const container = document.createElement('div');

            for (let i = 0; i < config.form.length; i++) {
                const ele = document.createElement('input')
                ele.value = config.form[i].startingValue;
                container.append(ele);
                input.push(ele);
            }

            return container;
        },
        onClose: (button: string | null): void => {
            if (button !== "Set" || input === null) {
                if (config.onCancel) {
                    config.onCancel();
                }
                return;
            }

            const values = new Array<any>();
            for (let i = 0; i < config.form.length; i++) {
                values[i] = input[i]?.value;
            }
            config.onUpdate(values);
        },
    });
}
