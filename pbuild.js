/*jslint browser:true */
"use strict";

var pb = (function () {
    var create_node;

    function remove_element_children(e) {
        while (e.firstChild) {
            e.removeChild(e.firstChild);
        }
    }

    function get_target_element(e) {
        // <http://stackoverflow.com/a/1553668>
        var tgt;
        e = e || window.event;
        tgt = e.target || e.srcElement;
        if (tgt.nodeType === 3) {
            tgt = tgt.parentNode;
        }
        return tgt;
    }

    function node_add(e) {
        var tgt;
        tgt = get_target_element(e);
        // assumes ul is the last one
        tgt.parentElement.lastChild.appendChild(create_node());
    }

    function node_remove(e) {
        var tgt;
        tgt = get_target_element(e).parentElement; // x, parent is li inside ul
        if (tgt !== null && tgt.parentElement !== null) {
            tgt.parentElement.removeChild(tgt); // remove the li from the ul
        }
    }

    function node_move_up(e) {
        // swap with previous sibling if any
        var tgt;
        tgt = get_target_element(e).parentNode;

        if (tgt.previousSibling !== null && tgt.parentNode !== null) {
            tgt.parentNode.insertBefore(tgt, tgt.previousSibling);
        }
    }

    function node_move_down(e) {
        // swap with next sibling if any
        var tgt;
        tgt = get_target_element(e).parentNode;

        if (tgt.nextSibling !== null && tgt.parentNode !== null) {
            tgt.parentNode.insertBefore(tgt.nextSibling, tgt);
        }
    }

    function create_element(element_descriptor) {
        var elt, prop, key;
        elt = document.createElement(element_descriptor[0]);
        prop = element_descriptor[1];
        for (key in prop) {
            if (prop.hasOwnProperty(key)) {
                elt[key] = prop[key];
            }
        }
        return elt;
    }

    function list_expander(e) {
        var tgt;
        tgt = get_target_element(e).parentNode.lastChild;
        if (tgt.style.display === 'none') {
            tgt.style.display = 'block';
            tgt.parentNode.firstChild.textContent = '-';
        } else {
            tgt.style.display = 'none';
            tgt.parentNode.firstChild.textContent = '+';
        }
    }

    create_node = function () {
        var li, child_elts, i;

        child_elts = [
            ['span', { 'textContent': '-', onclick: list_expander }],
            ['input', { 'type': 'text', 'size': 6 }],
            ['input', { 'type': 'button', 'value': '+', 'onclick': node_add }],
            ['input', { 'type': 'button', 'value': 'x', 'onclick': node_remove }],
            ['input', { 'type': 'button', 'value': '^', 'onclick': node_move_up }],
            ['input', { 'type': 'button', 'value': 'v', 'onclick': node_move_down }],
            ['ul', {}]
        ];

        li = document.createElement('li');

        for (i = 0; i < child_elts.length; i += 1) {
            li.appendChild(create_element(child_elts[i]));
        }

        return li;
    };

    function insert_root_node(id) {
        remove_element_children(document.getElementById(id));
        document.getElementById(id).appendChild(create_node());
    }

    return {
        'insert_root_node': insert_root_node,
    };
}());

