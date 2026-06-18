class ResizeObserverStub implements ResizeObserver {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
}

export function installResizeObserverStub(): void {
    if (typeof window.ResizeObserver !== 'undefined') return;

    Object.defineProperty(window, 'ResizeObserver', {
        configurable: true,
        writable: true,
        value: ResizeObserverStub,
    });
}
