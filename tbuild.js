/*jslint browser:true */
var tb = (function () {
    "use strict";
    var translators;

    translators = {
        /*
         * dom/xml provides:
         *   create_element(text, [root])
         *   get_next_sibling(elt)
         *   get_previous_sibling(elt)
         *   get_value(elt)
         *   get_first_child(elt)
         *   iterate_children(elt, fn)
         *   append_child(dst, appendee)
         */

        'dom': {
            // elt is an LI which contains a SPAN, INPUT, INPUT, INPUT, INPUT, INPUT, UL
            'create_element': function (text) {
                var li, child_elts, i, parent_this;

                if (text === undefined) {
                    text = '';
                }

                parent_this = this; // need to access own create_element

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

                child_elts = [
                    ['span', {
                        'textContent':  '-',
                        'onclick':      function (e) {
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
                    }],
                    ['input', { 'type': 'text', 'value': text, 'size': 6 }],
                    ['input', {
                        'type':     'button',
                        'value':    '+',
                        'onclick':  function (e) {
                            var tgt;
                            tgt = get_target_element(e);
                            tgt.parentElement.lastElementChild.appendChild(parent_this.create_element());
                        }
                    }],
                    ['input', {
                        'type':     'button',
                        'value':    'x',
                        'onclick':  function (e) {
                            var tgt;
                            tgt = get_target_element(e).parentElement;
                            if (tgt !== null && tgt.parentElement !== null) {
                                tgt.parentElement.removeChild(tgt);
                            }
                        }
                    }],
                    ['input', {
                        'type':     'button',
                        'value':    '^',
                        'onclick':  function (e) {
                            // swap with previous sibling if any
                            var tgt;
                            tgt = get_target_element(e).parentNode;

                            if (tgt.previousElementSibling !== null && tgt.parentNode !== null) {
                                tgt.parentNode.insertBefore(tgt, tgt.previousElementSibling);
                            }
                        }
                    }],
                    ['input', {
                        'type':     'button',
                        'value':    'v',
                        'onclick':  function (e) {
                            // swap with next sibling if any
                            var tgt;
                            tgt = get_target_element(e).parentNode;

                            if (tgt.nextElementSibling !== null && tgt.parentNode !== null) {
                                tgt.parentNode.insertBefore(tgt.nextElementSibling, tgt);
                            }
                        }
                    }],
                    ['ul', {}]
                ];

                li = document.createElement('li');

                function element_from_descriptor(element_descriptor) {
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

                for (i = 0; i < child_elts.length; i += 1) {
                    li.appendChild(element_from_descriptor(child_elts[i]));
                }

                return li;
            },
            'get_next_sibling': function (elt) {
                return elt.nextElementSibling;
            },
            'get_previous_sibling': function (elt) {
                return elt.previousElementSibling;
            },
            'get_value': function (elt) {
                return elt.firstElementChild.nextElementSibling.value;
            },
            'get_first_child': function (elt) {
                if (elt.lastElementChild.tagName === 'UL') {
                    return elt.lastElementChild.firstElementChild;
                }
                return null;
            },
            'iterate_children': function (elt, fn) {
                var kid;
                for (kid = this.get_first_child(elt); kid !== null; kid = this.get_next_sibling(kid)) {
                    fn(kid);
                }
            },
            'append_child': function (elt, elt2) {
                elt.lastElementChild.appendChild(elt2);
            }
        },

        'xml': {
            'create_element': function (text) {
                var node, attr;

                if (this.root === undefined) {
                    this.root = document.implementation.createDocument(null, 'nodetree', null);
                }
                attr = this.root.createAttribute('value');
                attr.nodeValue = text;
                node = this.root.createElement('node');
                node.setAttributeNode(attr);
                return node;
            },
            'get_next_sibling': function (node) {
                return node.nextElementSibling;
            },
            'get_previous_sibling': function (node) {
                return node.previousElementSibling;
            },
            'get_value': function (node) {
                return node.getAttribute('value');
            },
            'get_first_child': function (node) {
                return node.firstElementChild;
            },
            'iterate_children': function (node, fn) {
                var kid;
                for (kid = this.get_first_child(node); kid !== null; kid = this.get_next_sibling(kid)) {
                    fn(kid);
                }
            },
            'append_child': function (node, node2) {
                node.appendChild(node2);
            }
        }
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
        return serializer(
            translate(src_elt, translators.dom, translators.xml)
        );
    }

    function unserialize_from_string(dst_elt, src_doc) {
        // fill dst_elt based on xml parsed from 
        remove_element_children(dst_elt);

        console.log(src_doc);

        translators.dom.append_child(
            dst_elt,
            translate(src_doc, translators.xml, translators.dom)
        );
    }

    function serialize_by_ids(src_id, dst_id) {
        document.getElementById(dst_id).value = serialize_from_dom(
            document.implementation.createDocument(null, 'nodetree', null),
            document.getElementById(src_id)
        );
    }

    function xml_parser(xml) {
        return (new window.DOMParser()).parseFromString(xml, 'text/xml');
    }

    function unserialize_by_ids(src_id, dst_id) {
        // recreate the tree based on the textarea contents
        unserialize_from_string(
            document.getElementById(dst_id),
            xml_parser(document.getElementById(src_id).value)
        );
    }

    function reset_root_node(id) {
        // put a default one-node tree in there
        unserialize_from_string(
            document.getElementById(id),
            xml_parser('<nodetree><node/></nodetree>')
        );
    }

    return {
        'reset_root_node': reset_root_node,
        'serialize': serialize_by_ids,
        'unserialize': unserialize_by_ids
    };
}());
