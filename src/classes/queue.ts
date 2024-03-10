//Array-based implementation with generics
//Credit: https://dev.to/glebirovich/typescript-data-structures-stack-and-queue-hld

//General queue interface
interface IQueue<T> {
    enqueue(item: T): void,
    dequeue(): T | undefined,
    peek(): T | undefined,
    size(): number
}

//Shuffle queue with some tweaks
//You can see the whole queue - but you can't edit it, FIFO is still intact
//If you try to enqueue a value, and the queue is full - the queue will dequeue an item and add it.
class CustomQueue<T> implements IQueue<T> {
    private array: T[];
    private capacity: number;
    private numOfItems: number;
    constructor(capacity: number) {
        this.array = []
        this.capacity = capacity;
        this.numOfItems = 0;
    }

    enqueue(item: T): void {
        if (this.numOfItems >= this.capacity) {
            this.dequeue();
        }
        this.array.push(item);
        this.numOfItems++;
    }

    dequeue(): T | undefined {
        this.numOfItems--;
        return this.array.shift();
    }

    peek(): T | undefined {
        return this.array[0]
    }

    size(): number {
        return this.numOfItems;
    }

    items(): T[] {
        return this.array;
    }
}