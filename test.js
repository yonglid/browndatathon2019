'use strict';



/*
d3.csv('activity_data.csv').then(data => {
    console.log('Building crossfilter...');

    const ndx = crossfilter(data);
    console.log(data.columns);

    console.log('Building dimensioins...');

    const by_country = ndx.dimension(d => d['country']);
    //const by_device = ndx.dimension(d => d['user_country']);
    //const by_action = ndx.dimension(d => d['user_action']);

    console.log('Building charts...');

    const country_pie = dc.pieChart('#country-pie')
        .width(768)
        .height(480)
        .slicesCap(10)
        .dimension(by_country)
        .group(by_country.group())
        .legend(dc.legend());

    dc.renderAll();
    console.log('Done');
});
*/

d3.csv('hotel_data.csv').then(data => {
    const ndx = crossfilter(data);
    console.log(data.columns);

    const by_city = ndx.dimension(d => d['city_name']);
    const by_star_rating = ndx.dimension(d => d['star_rating']);
    const by_bubble_score = ndx.dimension(d => d['bubble_score']);
    const by_review_count = ndx.dimension(d => d['review_count']);
    const by_hotel_type = ndx.dimension(d => d['hotel_type']);

    const city_pie = dc.pieChart('#city-pie')
        .width(768)
        .height(480)
        .slicesCap(10)
        .dimension(by_city)
        .group(by_city.group())
        .legend(dc.legend());

    const hotel_type_pie = dc.pieChart('#hotel-type-pie')
        .width(768)
        .height(480)
        .slicesCap(10)
        .dimension(by_hotel_type)
        .group(by_hotel_type.group())
        .legend(dc.legend());

    const stars_pie = make_pie_chart('#stars-pie', 'Star Rating', by_star_rating).render();
    console.log(stars_pie);

    dc.renderAll();
});
