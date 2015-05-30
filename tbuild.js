/*jslint browser:true */
var tb = (function () {
    "use strict";
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
        tgt.parentElement.lastElementChild.appendChild(create_node());
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

        if (tgt.previousElementSibling !== null && tgt.parentNode !== null) {
            tgt.parentNode.insertBefore(tgt, tgt.previousElementSibling);
        }
    }

    function node_move_down(e) {
        // swap with next sibling if any
        var tgt;
        tgt = get_target_element(e).parentNode;

        if (tgt.nextElementSibling !== null && tgt.parentNode !== null) {
            tgt.parentNode.insertBefore(tgt.nextElementSibling, tgt);
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
        tgt = get_target_element(e).parentNode.lastElementChild;
        if (tgt.style.display === 'none') {
            tgt.style.display = 'block';
            tgt.parentNode.firstElementChild.textContent = '-';
        } else {
            tgt.style.display = 'none';
            tgt.parentNode.firstElementChild.textContent = '+';
        }
    }

    create_node = function (text) {
        var li, child_elts, i;

        child_elts = [
            ['span', { 'textContent': '-', onclick: list_expander }],
            ['input', { 'type': 'text', 'value': text, 'size': 6 }],
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

    function get_elt_value(elt) {
        // elt is some LI which contains a SPAN, INPUT, INPUT, INPUT, INPUT, INPUT, UL
        // the value is the value of the first input tag
        return elt.firstElementChild.nextElementSibling.value;
    }

    function get_first_child(elt) {
        // elt is some LI which contains a SPAN, INPUT, INPUT, INPUT, INPUT, INPUT, UL
        if (elt.lastElementChild.tagName === 'UL') {
            return elt.lastElementChild.firstElementChild; // this should be an LI
        }
        return null;
    }

    function element_child_iterator(elt, fn) {
        var kid;
        for (kid = get_first_child(elt); kid !== null; kid = kid.nextElementSibling) {
            fn(kid);
        }
    }

    function node_child_iterator(node, fn) {
        var kid;
        for (kid = node.firstElementChild; kid !== null; kid = kid.nextElementSibling) {
            fn(kid);
        }
    }

    function serialize(elt, root) {
        // elt is an LI in our UL#nodetree
        // it has children SPAN, INPUT, INPUT, INPUT, INPUT, INPUT, and optional UL
        var node, attr;

        attr = root.createAttribute('value');

        attr.nodeValue = get_elt_value(elt);

        node = root.createElement('node');
        node.setAttributeNode(attr);

        element_child_iterator(elt, function (kid) {
            node.appendChild(serialize(kid, root));
        });

        return node;
    }

    function unserialize(node) {
        var elt;

        elt = create_node(node.getAttribute('value'));

        node_child_iterator(node, function (kid) {
            elt.lastElementChild.appendChild(unserialize(kid));
        });

        return elt;
    }

    function serialize_to(id) {
        var target, root;

        target = document.getElementById(id);

        root = document.implementation.createDocument(null, 'nodetree', null);

        root.documentElement.appendChild(serialize(document.getElementById('nodetree').firstElementChild, root));

        target.value = (new XMLSerializer()).serializeToString(root);
    }

    function unserialize_from(id) {
        var src_raw, src_xml, dst, src_root;

        src_raw = document.getElementById(id).value;
        src_xml = (new DOMParser()).parseFromString(src_raw, 'text/xml');
        src_root = src_xml.firstChild.firstChild;

        dst = document.getElementById('nodetree');

        remove_element_children(dst);

        dst.appendChild(unserialize(src_root));
    }

    function insert_root_node(id) {
        remove_element_children(document.getElementById(id));
        document.getElementById(id).appendChild(create_node());
    }

    return {
        'insert_root_node': insert_root_node,
        'serialize_to': serialize_to,
        'unserialize_from': unserialize_from
    };
}());
