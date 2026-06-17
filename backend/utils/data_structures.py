from typing import Any

from common import Order


class Node:
    def __init__(
        self, val: Any, prev: "Node | None " = None, next: "Node | None " = None
    ) -> None:
        self.prev = prev
        self.next = next
        self.val = val


class DoublyLinkedList:
    def __init__(self) -> None:
        self.head = Node(None)
        self.tail = Node(None)
        self.head.next = self.tail
        self.tail.prev = self.head

    def prepend(self, val: Any) -> Node:
        new_node = Node(val, prev=self.head, next=self.head.next)
        self.head.next.prev = new_node
        self.head.next = new_node
        return new_node

    def append(self, val: Any) -> Node:
        new_node = Node(val, prev=self.tail.prev, next=self.tail)
        self.tail.prev.next = new_node
        self.tail.prev = new_node
        return new_node

    def is_empty(self) -> bool:
        return self.head.next == self.tail

    def remove(self, node: Node) -> None:
        if node.next is None or node.prev is None:
            return  # Node is not in the list
        node.prev.next = node.next
        node.next.prev = node.prev

    def display(self) -> None:
        curr = self.head.next
        vals = []
        while curr != self.tail:
            vals.append(curr.val)
            curr = curr.next
