namespace Mediator {
    interface LocationResult {
        country: string;
        province: string;
        city: string;
    }

    class LocationPicker {
        $country = $(document.createElement('select'));
        $province = $(document.createElement('select'));
        $city = $(document.createElement('select'));

        $element = $(document.createElement('div'))
            .append(this.$country)
            .append(this.$province)
            .append(this.$city);

        constructor() {
            LocationPicker.setOptions(this.$country, LocationPicker.getCountries());
            LocationPicker.setOptions(this.$province, ['-']);
            LocationPicker.setOptions(this.$city, ['-']);

            this.$country.change(() => {
                this.updateProvinceOptions();
            });

            this.$province.change(() => {
                this.updateCityOptions();
            });
        }

        updateProvinceOptions(): void {
            let country: string = this.$country.val();

            let provinces = LocationPicker.getProvincesByCountry(country);
            LocationPicker.setOptions(this.$province, provinces);

            this.$city.val('-');
        }

        updateCityOptions(): void {
            let country: string = this.$country.val();
            let province: string = this.$province.val();

            let cities = LocationPicker.getCitiesByCountryAndProvince(country, province);
            LocationPicker.setOptions(this.$city, cities);
        }

        get value(): LocationResult {
            return {
                country: this.$country.val(),
                province: this.$province.val(),
                city: this.$city.val()
            };
        }

        private static setOptions($select: JQuery, values: string[]): void {
            $select.empty();

            let $options = values.map(value => {
                return $(document.createElement('option'))
                    .text(value)
                    .val(value);
            });

            $select.append($options);
        }

        private static getCountries(): string[] {
            return ['-'].concat([/* countries */]);
        }

        private static getProvincesByCountry(country: string): string[] {
            return ['-'].concat([/* provinces */]);
        }

        private static getCitiesByCountryAndProvince(country: string, province: string): string[] {
            return ['-'].concat([/* cities */]);
        }
    }
}
