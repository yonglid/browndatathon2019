const color_scale = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000'];
dc.config.defaultColors(color_scale);

const multikey = (k, v) => k + ':' + v;
const splitkey = kv => kv.split(':');

const splitkey_group = (group, vfilter) => ({
    all() {
        const all = group.all();
        const acc = {};

        all.map(d => {
            const [k, v] = splitkey(d.key);
            acc[k] = acc[k] || {};
            acc[k][v] = d.value;
        });

        return Object.entries(acc).map(kv => ({
            key: kv[0],
            value: kv[1]
        }));
    }
});

const splitkey_sel = i => d => d.value[i];

const splitkey_title = function(d) {
    return `${d.key}[${this.layer}]: ${d.value[this.layer]}`;
};



const chart_reset_handler = chart =>
    () => {
        chart.filterAll();
        dc.redrawAll();
    };

const chart_add_reset = id => {
    const span = $('<span class="reset" style="visibility: hidden;"></span>');
    const reset = $('<a href="javascript:void(0)">Reset</a>');
    const filterbtn = $('<a href="javascript:void(0)">Show</a>');
    const filter = $('<div class="wrap"><span class="filter" style="position: relative; white-space: pre-wrap;"></span></div>');

    filterbtn.hover(() => {
        console.log('hover');
        filter.show();
    }, () => {
        filter.hide();
    });

    span.append('Filters: ').append(reset).append(' | ').append(filterbtn).append('<br>').append(filter);
    $(id).append(span);
    return reset;
};

const make_bar_chart = (id, name, dim, reset_ = true) => {
    $(id).empty();
    const reset = reset_ && chart_add_reset(id);
    const chart = dc.barChart(id)
                    .margins({top: 25, right: 50, bottom: 50, left: 50})
                    .barPadding(0.1)
                    .outerPadding(0.05)
                    .dimension(dim)
                    .x(d3.scaleBand())
                    .xUnits(dc.units.ordinal)
                    .xAxisLabel(name)
                    .group(dim.group().reduceCount())
                    .yAxisLabel('Count')
                    .ordinalColors(color_scale)
                    .renderLabel(true)
                    .turnOnControls(true)
                    .controlsUseVisibility(true);
    reset && reset.click(chart_reset_handler(chart));
    return chart;
};

const make_pie_chart = (id, name, dim) => {
    $(id).empty();
    $(id).append($(`<span><strong>${name} </strong></span>`)).append('<br>');

    const chart = dc.pieChart(id)
                    .slicesCap(10)
                    .dimension(dim)
                    .group(dim.group())
                    .legend(dc.legend())
                    .turnOnControls(true)
                    .controlsUseVisibility(true);

    chart.on('pretransition', chart => {
        const make_label = d => {
            const label = d.data.key;
            const count = d.data.value;
            const percentage = (d.endAngle - d.startAngle) / (2 * Math.PI) * 100;
            return `${label}: ${count} (${percentage.toFixed(2)}%)`;
        };

        chart.selectAll('text.pie-slice.pie-label')
             .append('svg:title')
             .text(make_label);
        chart.selectAll('title').html(make_label);
    });

    //const reset = chart_add_reset(id);
    //reset.click(chart_reset_handler(chart));
    return chart;
};

const make_stacked_chart = (id, name, dim, field) => {
    const vals = dataset.dimension(d => d[field])
                        .group().all()
                        .map(d => d.key)
                        .sort((a, b) => a.localeCompare(b));
    const accessors = vals.map(v => [v, d => d.value[v].count]);

    const reducer = reductio();
    vals.map(v => reducer.value(v).filter(d => d[field] == v).count(true));
    const group = reducer(dim.group());

    const reset = chart_add_reset(id);
    const chart = make_bar_chart(id, name, dim, false)
        .legend(dc.legend().horizontal(true).itemWidth(100).x(30).y(-5))
        .title(function(d) {
            return `${this.x} - ${this.layer}: ${d.value[this.layer].count}`;
        });

    accessors.map((a, i) => chart[i == 0 ? 'group' : 'stack'](group, a[0], a[1]));
    reset.click(chart_reset_handler(chart));

    return chart;
};

const make_custom_stacked_chart = (id, name, dim, reducer, accessors) => {
    const group = reducer(dim.group());

    const reset = chart_add_reset(id);
    const chart = make_bar_chart(id, name, dim, false)
        .legend(dc.legend().horizontal(true).itemWidth(100).x(30).y(-5))
        .title(function(d) {
            return `${this.x}[${this.layer}]: ${d.value[this.layer].count}`;
        });

    accessors.map((a, i) => chart[i == 0 ? 'group' : 'stack'](group, a[0], a[1]));
    reset.click(chart_reset_handler(chart));

    return chart;
};

const make_table = (id, dim, groupfn, columns, page_size) => {
    $(id).empty();

    const chart = dc.dataTable(id)
                    .dimension(dim)
                    .group(groupfn || (d => ''))
                    .columns(columns)
                    .order(d3.descending)
                    .size(page_size ? Infinity : 25);

    if (page_size) {

        const controls = $('<div class="controls"></div>');
        const begin = $('<span></span>');
        const end = $('<span></span>');
        const size = $('<span></span>');
        const first = $('<input type="button" value="First"/>');
        const prev = $('<input type="button" value="Previous"/>');
        const next = $('<input type="button" value="Next"/>');
        const last = $('<input type="button" value="Last"/>');

        controls.append('Table showing ').append(begin).append('-').append(end).append(' of ').append(size).append('<br>');
        controls.append(first).append(prev).append(next).append(last);

        $(id).prepend(controls);

        // Either dimensions, null dimensions, or groups can be passed
        const get_filtered = () => {
            if (dim.group) {
                const group = dim.group();
                return group.size() == 1 ? group.all()[0].value : group.size();
            } else {
                return dim.size();
            }
        };

        let curr_offset = 0;
        const update_offset = offset => {
            const total_filtered = get_filtered();

            curr_offset += offset;

            if (curr_offset >= total_filtered)
                curr_offset = Math.floor((total_filtered - 1) / page_size) * page_size;
            if (curr_offset < 0)
                curr_offset = 0;

            chart.beginSlice(curr_offset);
            chart.endSlice(curr_offset + page_size);
        };

        const display = () => {
            const total_filtered = get_filtered();

            begin.text(curr_offset);
            end.text(curr_offset + page_size > total_filtered ? total_filtered : curr_offset + page_size);

            first.attr('disabled', curr_offset - page_size < 0 ? 'true' : null);
            prev.attr('disabled', curr_offset - page_size < 0 ? 'true' : null);
            next.attr('disabled', curr_offset + page_size > total_filtered ? 'true' : null);
            last.attr('disabled', curr_offset + page_size > total_filtered ? 'true' : null);

            size.text(total_filtered);
        };

        first.click(() => { update_offset(-get_filtered()); chart.redraw(); });
        prev.click(() => { update_offset(-page_size); chart.redraw(); });
        next.click(() => { update_offset(+page_size); chart.redraw(); });
        last.click(() => { update_offset(+get_filtered()); chart.redraw(); });

        chart.on('preRedraw', () => update_offset(0));
        chart.on('preRender', () => update_offset(0));
        chart.on('pretransition', display);
    }

    return chart;
};

const make_distinct_table = (id, dim, keyname, page_size) =>
      make_table(id, dim.group(), null, [{
          label: keyname,
          format: d => d.key
      }, {
          label: 'Count',
          format: d => d.value
      }], page_size);

const make_count = (id, dim, group) => {
    const count = dc.dataCount(id)
                    .dimension(dim)
                    .group(group)
                    .html({
                        some: `<strong>%filter-count</strong> selected out of <strong>%total-count</strong> phenotypes | <a href="javascript:dc.filterAll(); dc.renderAll();">Reset All</a>`,
                        all: `All phenotypes selected. Click on the graphs to apply filters.`
                    });

    return count;
};
