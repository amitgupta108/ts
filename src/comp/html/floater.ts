let isDragging: boolean = false;
let startX: number = 0;
let startY: number = 0;
let initialLeft: number = 0;
let initialTop: number = 0;
let isResizing: boolean = false;
let startWidth: number = 0;
let startHeight: number = 0;

export class Floater {
    self: HTMLDivElement;
    head: HTMLDivElement;
    resizer?: HTMLDivElement;

    constructor(id: string, resizable: boolean = false) {
        this.self = document.getElementById(id) as HTMLDivElement;
        this.head = document.createElement("div")
        this.head.id = id + '-header';
        this.head.classList.add("floater-header");
        this.self.appendChild(this.head);

        if (resizable) {
            this.resizer = document.createElement("div");
            this.resizer.id = id + '-resizer';
            this.resizer.classList.add("floater-resizer-br");
            this.self.appendChild(this.resizer);
        }
        /*
        this.header.addEventListener("mousedown", (e: MouseEvent) => {
            isDragging = true;
            e.preventDefault();
            document.body.classList.add('is-dragging');

            // Record starting positions
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = this.popup.offsetLeft;
            initialTop = this.popup.offsetTop;

            // Add global event listeners so cursor movements aren't lost if moving quickly
            document.addEventListener("mousemove", (e: MouseEvent) => this.dragPopup(e));
            document.addEventListener("mouseup", (e: MouseEvent) => this.stopDragPopup(e));
        });

        this.resizer.addEventListener("mousedown", (e: MouseEvent) => {
            isResizing = true;
            e.preventDefault();
            document.body.classList.add('is-dragging');

            // Record starting dimensions
            startX = e.clientX;
            startY = e.clientY;
            startWidth = this.popup.offsetWidth;
            startHeight = this.popup.offsetHeight;

            document.addEventListener("mousemove", (e: MouseEvent) => this.resizePopup(e));
            document.addEventListener("mouseup", (e: MouseEvent) => this.stopResizePopup(e));
        });
    }

    dragPopup(e: MouseEvent) {
        if (!isDragging) return;
        // Calculate distance cursor moved
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Apply new coordinates to the popup boundary style
        this.popup.style.left = `${initialLeft + deltaX}px`;
        this.popup.style.top = `${initialTop + deltaY}px`;
    }

    stopDragPopup(e: MouseEvent) {
        isDragging = false;
        document.removeEventListener("mousemove", (e: MouseEvent) => this.dragPopup(e));
        document.removeEventListener("mouseup", (e: MouseEvent) => this.stopDragPopup(e));

        document.body.classList.remove('is-dragging');
    }

    resizePopup(e: MouseEvent) {
        if (!isResizing) return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Constraints are controlled safely by min-width and min-height in CSS
        this.popup.style.width = `${startWidth + deltaX}px`;
        this.popup.style.height = `${startHeight + deltaY}px`;
    }

    stopResizePopup(e: MouseEvent) {
        isResizing = false;
        document.removeEventListener("mousemove", (e: MouseEvent) => this.resizePopup);
        document.removeEventListener("mouseup", (e: MouseEvent) => this.stopResizePopup);

        document.body.classList.remove('is-dragging');
    }
        */
    }

    p_init() {
        this.head.addEventListener('pointerdown', (e) => {
            e.preventDefault(); // Stop text selection / canvas image dragging glitches

            // 1. Lock the mouse stream to this handle (this makes the overlay obsolete!)
            this.head.setPointerCapture(e.pointerId);
            document.body.classList.add('is-dragging');

            // Track starting points
            const startX = e.clientX;
            const startY = e.clientY;
            const initialLeft = this.self.offsetLeft;
            const initialTop = this.self.offsetTop;

            // 2. Global move listener
            const onPointerMove = (moveEvent: PointerEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;

                this.self.style.left = `${initialLeft + deltaX}px`;
                this.self.style.top = `${initialTop + deltaY}px`;
            };

            // 3. Global release listener
            const onPointerUp = (upEvent: PointerEvent) => {
                document.body.classList.remove('is-dragging');

                // Safely release the browser pointer lock
                try {
                    this.head.releasePointerCapture(upEvent.pointerId);
                } catch (err) { }

                // Cleanup listeners immediately
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
            };

            // Attach to window so movement is smooth even if the mouse flies off the popup
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        });
    }
}