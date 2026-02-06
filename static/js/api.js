async function get_categories() {
    try {
        res = await fetch("/category/");
        if (!res.ok) throw new Error("fetching data fails");
        const data = await res.json();
        return data;
    } catch(err) {
        console.error(err);
        return null;
    }
}