/*jslint browser:true */
var tb = (function () {
    "use strict";
    var xml_translator, dom_translator;

    function DefaultTranslator() {
        this.get_next_sibling = function (e) {
            return e.nextElementSibling;
        };
        this.get_previous_sibling = function (e) {
            return e.previousElementSibling;
        };
        this.get_value = function (e) {
            return e.value;
        };
        this.get_first_child = function (e) {
            return e.firstElementChild;
        };
        this.iterate_children = function (e, fn) {
            var kid;
            for (kid = this.get_first_child(e); kid !== null; kid = this.get_next_sibling(kid)) {
                fn(kid);
            }
        };
        this.append_child = function (dst, appendee) {
            dst.appendChild(appendee);
        };
    }

    xml_translator = new DefaultTranslator();
    xml_translator.get_value = function (e) {
        return e.getAttribute('value');
    };
    xml_translator.create_element = function (text) {
        var node, attr;

        if (this.root === undefined) {
            this.root = document.implementation.createDocument(null, 'nodetree', null);
        }
        attr = this.root.createAttribute('value');
        attr.nodeValue = text;
        node = this.root.createElement('node');
        node.setAttributeNode(attr);
        return node;
    };

    dom_translator = new DefaultTranslator();
    dom_translator.create_element = function (text) {
        var parent_this, element_from_descriptor, node, children, buttons;

        if (text === undefined) {
            text = '';
        }

        parent_this = this; // need to access own create_element

        node = document.createElement('li');

        function fill_up_children(elt, child_list) {
            var i;
            for (i = 0; i < child_list.length; i += 1) {
                elt.appendChild(element_from_descriptor(child_list[i]));
            }
        }

        function set_attributes(elt, attrs) {
            var attr;
            for (attr in attrs) {
                if (attrs.hasOwnProperty(attr)) {
                    elt[attr] = attrs[attr];
                }
            }
        }

        element_from_descriptor = function (element_descriptor) {
            var elt;

            elt = document.createElement(element_descriptor.tag);

            if (element_descriptor.attributes !== undefined) {
                set_attributes(elt, element_descriptor.attributes);
            }

            if (element_descriptor.children !== undefined) {
                fill_up_children(elt, element_descriptor.children);
            }

            return elt;
        };

        fill_up_children(node, [
            {
                'tag': 'span',
                'attributes': {
                    'textContent':  '-',
                    'onclick':      function () {
                        if (children.style.display === 'none') {
                            children.style.display = 'block';
                            node.firstElementChild.textContent = '-';
                        } else {
                            children.style.display = 'none';
                            node.firstElementChild.textContent = '+';
                        }
                    }
                }
            },
            {
                'tag': 'input',
                'attributes': {
                    'type': 'text',
                    'value': text,
                    'size': 6
                }
            }
        ]
            );

        buttons = document.createElement('div');
        fill_up_children(buttons, [
            {
                'tag': 'span',
                'attributes': {
                    'textContent':  '+',
                    'onclick':      function () {
                        children.appendChild(parent_this.create_element());
                    }
                }
            },
            {
                'tag': 'span',
                'attributes': {
                    'textContent':  'x',
                    'onclick':      function () {
                        if (node.parentElement !== null) {
                            node.parentElement.removeChild(node);
                        }
                    }
                }
            },
            {
                'tag': 'span',
                'attributes': {
                    'textContent':  '^',
                    'onclick':      function () {
                        // swap with previous sibling if any
                        if (node.previousElementSibling !== null && node.parentNode !== null) {
                            node.parentNode.insertBefore(node, node.previousElementSibling);
                        }
                    }
                }
            },
            {
                'tag': 'span',
                'attributes': {
                    'textContent':  'v',
                    'onclick':      function () {
                        if (node.nextElementSibling !== null && node.parentNode !== null) {
                            node.parentNode.insertBefore(node.nextElementSibling, node);
                        }
                    }
                }
            }
        ]
                         );

        node.appendChild(buttons);

        children = document.createElement('ul');
        node.appendChild(children);

        return node;
    };
    dom_translator.get_value = function (e) {
        return e.firstElementChild.nextElementSibling.value;
    };
    dom_translator.get_first_child = function (e) {
        if (e.lastElementChild !== null && e.lastElementChild.tagName === 'UL') {
            return e.lastElementChild.firstElementChild;
        }
        return null;
    };
    dom_translator.append_child = function (e1, e2) {
        e1.lastElementChild.appendChild(e2);
    };

    function remove_element_children(e) {
        while (e.firstChild) {
            e.removeChild(e.firstChild);
        }
    }

    function translate(e_src, t_src, t_dst) {
        var e_dst;

        e_dst = t_dst.create_element(t_src.get_value(e_src));

        t_src.iterate_children(e_src, function (kid) {
            t_dst.append_child(e_dst, translate(kid, t_src, t_dst));
        });

        return e_dst;
    }

    function serialize_from_dom(src_elt, serializer) {
        var root;

        root = document.implementation.createDocument(null, 'nodetree', null);

        root.documentElement.appendChild(
            translate(src_elt, dom_translator, xml_translator)
        );

        return serializer(root);
    }

    function unserialize_from_string(dst_elt, src_doc) {
        remove_element_children(dst_elt);

        dst_elt.appendChild(
            translate(src_doc, xml_translator, dom_translator)
        );
    }

    function serialize_by_ids(src_id, dst_id) {
        document.getElementById(dst_id).value = serialize_from_dom(
            document.getElementById(src_id).firstElementChild,
            function (root) {
                return (new window.XMLSerializer()).serializeToString(root);
            }
        );
    }

    function xml_parser(xml) {
        return (new window.DOMParser()).parseFromString(xml, 'text/xml');
    }

    function unserialize_by_ids(src_id, dst_id) {
        // recreate the tree based on the textarea contents
        unserialize_from_string(
            document.getElementById(dst_id),
            xml_parser(document.getElementById(src_id).value).firstElementChild.firstElementChild
        );
    }

    function reset_root_node(id) {
        // put a default one-node tree in there
        unserialize_from_string(
            document.getElementById(id),
            xml_parser('<nodetree><node/></nodetree>').firstElementChild.firstElementChild
        );
    }

    return {
        'reset_root_node': reset_root_node,
        'serialize': serialize_by_ids,
        'unserialize': unserialize_by_ids
    };
}());
