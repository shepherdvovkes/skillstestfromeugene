import { cn } from '@/utils/cn';

describe('Utility Functions', () => {
  describe('cn function', () => {
    it('combines class names correctly', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('handles conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
      expect(result).toBe('base-class conditional-class');
    });

    it('handles object syntax', () => {
      const result = cn('base-class', {
        'active-class': true,
        'inactive-class': false,
        'conditional-class': true
      });
      expect(result).toBe('base-class active-class conditional-class');
    });

    it('handles mixed syntax', () => {
      const result = cn(
        'base-class',
        'static-class',
        true && 'conditional-class',
        {
          'object-class': true,
          'hidden-class': false
        }
      );
      expect(result).toBe('base-class static-class conditional-class object-class');
    });

    it('handles empty and undefined values', () => {
      const result = cn('base-class', '', undefined, null, false && 'hidden');
      expect(result).toBe('base-class');
    });

    it('handles arrays', () => {
      const result = cn('base-class', ['array-class1', 'array-class2']);
      expect(result).toBe('base-class array-class1 array-class2');
    });

    it('handles complex nested structures', () => {
      const result = cn(
        'base-class',
        ['array-class1', 'array-class2'],
        {
          'object-class': true,
          'hidden-class': false
        },
        true && 'conditional-class'
      );
      expect(result).toBe('base-class array-class1 array-class2 object-class conditional-class');
    });
  });
});
