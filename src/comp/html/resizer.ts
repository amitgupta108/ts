const navbarHeight = 60;

export class Resizer {
    type: string;
    self: HTMLDivElement;
    mousemovehandler: (e: MouseEvent) => void;
    pane1?: HTMLDivElement;
    pane2?: HTMLDivElement;
    flex_dim: number = 0;
    dim1: number = 0;
    dim2: number = 0;
    split: number = 0;

    constructor(type: string, self: string) {
        this.type = type;
        this.self = document.getElementById(self) as HTMLDivElement;

        this.mousemovehandler = (e) => {
            this.handleMouseMove(e);
        }

        this.self.addEventListener('mousedown', (e) => {
            this.handleEvent(e);
        });

        document.addEventListener('mouseup', () => {
            this.self.classList.remove('dragging');
            document.removeEventListener('mousemove', this.mousemovehandler);
        });
    }

    handleEvent(e: MouseEvent) {
        e.preventDefault();
        this.self.classList.add('dragging');
        document.addEventListener('mousemove', this.mousemovehandler);
    }

    handleMouseMove(e: MouseEvent) {
        let dim1Percent = this.type === 'h' ?
            ((e.clientY - navbarHeight) / this.flex_dim) * 100
            : (e.clientX / this.flex_dim) * 100;

        if (dim1Percent < 0.75 * this.split * 100) dim1Percent = 0.75 * this.split * 100;
        if (dim1Percent > 1.25 * this.split * 100) dim1Percent = 1.25 * this.split * 100;

        const dim = this.type === 'h' ? 'height' : 'width';
        this.pane1!.style[dim] = `${dim1Percent}%`;
        this.pane2!.style[dim] = `${100 - dim1Percent}%`;
    }

    render(pane1: string, pane2: string, split: number) {
        this.pane1 = document.getElementById(pane1) as HTMLDivElement;
        this.pane2 = document.getElementById(pane2) as HTMLDivElement;
        this.flex_dim = this.type === 'h' ?
            document.body.clientHeight - navbarHeight :
            document.body.clientWidth;
        this.dim1 = split * this.flex_dim;
        this.dim2 = (1 - split) * this.flex_dim;
    }
}